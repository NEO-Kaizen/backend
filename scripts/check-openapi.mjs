#!/usr/bin/env node
/**
 * Fonte única do contrato HTTP: valida e materializa a especificação OpenAPI.
 *
 * Uso:
 *   node scripts/check-openapi.mjs --write   # grava docs/openapi.json
 *   node scripts/check-openapi.mjs --check   # valida spec, rotas e artefato
 *
 * O check falha quando:
 * - a especificação não é OpenAPI 3.0.x ou lacks metadados obrigatórios;
 * - um `$ref` interno não resolve;
 * - uma operação não tem tag/summary/description/operationId único/responses;
 * - uma rota real do Express não está documentada (ou vice-versa);
 * - `docs/openapi.json` está desatualizado em relação a `src/docs/`.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import * as prettier from "prettier";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const artifactPath = path.join(rootDir, "docs", "openapi.json");
const checkMode = process.argv.includes("--check");
const writeMode = process.argv.includes("--write") || !checkMode;

// O checker importa a app real, que valida configuração. Garanta valores
// mínimos para rodar em qualquer ambiente (inclusive NODE_ENV=production sem
// segredos), sem conectar ao banco.
process.env.PROTOCOL_FPE_KEY ??= "docs-check-only-not-a-secret";
process.env.JWT_SECRET ??= "docs-check-only-not-a-secret";
process.env.NODE_ENV ??= "development";
process.env.SWAGGER_ENABLED = "false";

const prefixes = new WeakMap();
const HTTP_METHODS = new Set(["get", "post", "put", "patch", "delete", "head", "options", "trace"]);
const IGNORED_ROUTE_PREFIXES = ["/api-docs", "/uploads"];

/**
 * Registra o prefixo de cada Router montado. Precisa rodar ANTES de importar
 * `src/app.ts`, pois `router.use(prefix, child)` é a única forma de recuperar
 * o caminho completo na árvore do Express 5.
 */
function recordMounts(fnName, target) {
  const original = target[fnName];
  target[fnName] = function useWithMount(first, ...rest) {
    const args = [first, ...rest];
    if (typeof first === "string") {
      for (const handler of args.slice(1)) {
        if (typeof handler === "function" && Array.isArray(handler.stack)) {
          prefixes.set(handler, first);
        }
      }
    } else {
      for (const handler of args) {
        if (typeof handler === "function" && Array.isArray(handler.stack)) {
          prefixes.set(handler, "");
        }
      }
    }
    return original.apply(this, args);
  };
}

recordMounts("use", express.application);
recordMounts("use", express.Router.prototype);

const { app } = await import("../src/app.ts");
const { openapiSpec } = await import("../src/docs/swagger.ts");

const errors = [];
const warnings = [];

function joinPath(prefix, segment) {
  const joined = `${prefix.replace(/\/$/, "")}/${segment.replace(/^\//, "")}`;
  const normalized = joined.replace(/\/+/g, "/").replace(/\/$/, "");
  return normalized === "" ? "/" : normalized;
}

function normalizePath(routePath) {
  return routePath.replace(/\{([^}]+)\}/g, ":$1").replace(/\/$/, "") || "/";
}

function collectRoutes() {
  const routes = new Map();
  const walk = (stack, prefix = "") => {
    for (const layer of stack) {
      if (layer.route) {
        const fullPath = normalizePath(joinPath(prefix, layer.route.path));
        for (const method of Object.keys(layer.route.methods)) {
          routes.set(`${method.toUpperCase()} ${fullPath}`, {
            method: method.toUpperCase(),
            path: fullPath,
          });
        }
        continue;
      }
      const handler = layer.handle;
      if (handler?.stack) {
        walk(handler.stack, joinPath(prefix, prefixes.get(handler) ?? ""));
      }
    }
  };
  walk(app.router.stack);
  return routes;
}

function collectOperations() {
  const operations = new Map();
  for (const [pathKey, pathItem] of Object.entries(openapiSpec.paths)) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!HTTP_METHODS.has(method)) continue;
      const key = `${method.toUpperCase()} ${normalizePath(pathKey)}`;
      if (operations.has(key)) {
        errors.push(`Operação duplicada: ${key}`);
      }
      operations.set(key, { operation, pathKey, method });
    }
  }
  return operations;
}

function resolvePointer(ref) {
  if (!ref.startsWith("#/")) return undefined;
  return ref
    .slice(2)
    .split("/")
    .reduce((current, part) => {
      if (current === null || typeof current !== "object") return undefined;
      return current[part.replace(/~1/g, "/").replace(/~0/g, "~")];
    }, openapiSpec);
}

function collectRefs(value, trail, refs) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectRefs(item, `${trail}/${index}`, refs));
    return;
  }
  if (value && typeof value === "object") {
    if (typeof value.$ref === "string") refs.push({ ref: value.$ref, trail });
    for (const [key, nested] of Object.entries(value)) {
      collectRefs(nested, `${trail}/${key}`, refs);
    }
  }
}

function validateSpec() {
  if (!/^3\.0\.\d+$/.test(openapiSpec.openapi)) {
    errors.push(`Versão OpenAPI inesperada: ${openapiSpec.openapi}`);
  }
  if (!openapiSpec.info?.title || !openapiSpec.info?.version) {
    errors.push("`info.title` e `info.version` são obrigatórios.");
  }
  if (!openapiSpec.paths || Object.keys(openapiSpec.paths).length === 0) {
    errors.push("A especificação não declara paths.");
  }

  const tags = new Set((openapiSpec.tags ?? []).map((tag) => tag.name));
  const operationIds = new Set();

  for (const [pathKey, pathItem] of Object.entries(openapiSpec.paths)) {
    if (!pathKey.startsWith("/")) errors.push(`Path inválido: ${pathKey}`);
    const declaredPathParams = new Set(
      (pathItem.parameters ?? []).filter((parameter) => parameter.in === "path").map((p) => p.name),
    );
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!HTTP_METHODS.has(method)) continue;
      const label = `${method.toUpperCase()} ${pathKey}`;
      if (!operation.summary) errors.push(`${label}: falta summary.`);
      if (!operation.description) errors.push(`${label}: falta description.`);
      if (!operation.operationId) {
        errors.push(`${label}: falta operationId.`);
      } else if (operationIds.has(operation.operationId)) {
        errors.push(`operationId duplicado: ${operation.operationId}`);
      } else {
        operationIds.add(operation.operationId);
      }
      if (!Array.isArray(operation.tags) || operation.tags.length === 0) {
        errors.push(`${label}: falta tag.`);
      } else {
        for (const tag of operation.tags) {
          if (!tags.has(tag)) errors.push(`${label}: tag não declarada (${tag}).`);
        }
      }
      if (!operation.responses || Object.keys(operation.responses).length === 0) {
        errors.push(`${label}: falta responses.`);
      } else {
        for (const [status, response] of Object.entries(operation.responses)) {
          if (!response.description) errors.push(`${label}: response ${status} sem description.`);
        }
      }
      for (const parameter of operation.parameters ?? []) {
        if (parameter.in === "path") declaredPathParams.add(parameter.name);
        if (parameter.in === "path" && parameter.required !== true) {
          errors.push(`${label}: path param ${parameter.name} precisa de required: true.`);
        }
      }
      for (const name of pathKey.matchAll(/\{([^}]+)\}/g)) {
        if (!declaredPathParams.has(name[1])) {
          errors.push(`${label}: path param {${name[1]}} não declarado na operação.`);
        }
      }
      if (operation.requestBody && !operation.requestBody.content) {
        errors.push(`${label}: requestBody sem content.`);
      }
    }
  }

  const refs = [];
  collectRefs(openapiSpec, "#", refs);
  for (const { ref, trail } of refs) {
    if (!ref.startsWith("#/")) {
      warnings.push(`$ref externo não validado: ${ref} (${trail})`);
      continue;
    }
    if (resolvePointer(ref) === undefined) {
      errors.push(`$ref não resolve: ${ref} (${trail})`);
    }
  }

  const usedSchemas = new Set(
    refs
      .filter(({ ref }) => ref.startsWith("#/components/schemas/"))
      .map(({ ref }) => ref.split("/").pop()),
  );
  for (const name of Object.keys(openapiSpec.components?.schemas ?? {})) {
    if (!usedSchemas.has(name)) warnings.push(`Schema não referenciado: ${name}`);
  }
}

function validateRoutes() {
  const actual = collectRoutes();
  const documented = collectOperations();

  for (const [key, route] of actual) {
    if (IGNORED_ROUTE_PREFIXES.some((prefix) => route.path.startsWith(prefix))) continue;
    if (!documented.has(key)) {
      errors.push(`Rota sem documentação OpenAPI: ${route.method} ${route.path}`);
    }
  }
  for (const [key, operation] of documented) {
    if (!actual.has(key)) {
      errors.push(`OpenAPI documenta rota inexistente: ${operation.method} ${operation.pathKey}`);
    }
  }
  return { actual, documented };
}

async function formatJson(value) {
  const prettierConfig = await prettier.resolveConfig(artifactPath);
  return prettier.format(JSON.stringify(value), {
    ...prettierConfig,
    parser: "json",
    filepath: artifactPath,
  });
}

async function checkArtifact() {
  const expected = await formatJson(openapiSpec);
  if (!fs.existsSync(artifactPath)) {
    errors.push("docs/openapi.json não existe. Rode `npm run docs:openapi`.");
    return;
  }
  const current = fs.readFileSync(artifactPath, "utf8");
  if (current !== expected) {
    errors.push("docs/openapi.json está desatualizado. Rode `npm run docs:openapi`.");
  }
}

if (openapiSpec.paths) validateSpec();
const { actual, documented } = validateRoutes();

if (!writeMode) {
  await checkArtifact();
}

const coverage = `${documented.size} operações documentadas / ${actual.size} rotas reais`;
if (warnings.length > 0) {
  console.log(`Avisos (${warnings.length}):`);
  for (const warning of warnings) console.log(`  - ${warning}`);
}
console.log(coverage);

if (errors.length > 0) {
  console.error(`Falhas (${errors.length}):`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

if (writeMode) {
  fs.writeFileSync(artifactPath, await formatJson(openapiSpec));
  console.log(`OpenAPI: ${artifactPath}`);
} else {
  console.log("OpenAPI válido, rotas sincronizadas e artefato atualizado.");
}
