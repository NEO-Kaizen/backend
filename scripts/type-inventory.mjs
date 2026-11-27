/**
 * Gera `docs/type-inference.md` a partir do código-fonte real.
 *
 * Uso:
 *   node scripts/type-inventory.mjs           # grava o documento
 *   node scripts/type-inventory.mjs --check   # falha se o documento estiver desatualizado
 *
 * Critérios de contagem:
 * - arquivos: todos os `src/**\/*.ts` do `tsconfig.json`, exceto `.d.ts`;
 * - tipos nomeados: interfaces, aliases, classes e enums declarados no source file;
 * - declarações sem anotação: variáveis (inclusive destructuring, `for...of`/`for...in`
 *   e variável de `catch`), parâmetros e retornos de funções/métodos/acessores;
 * - `any`: tipo efetivo do checker (`ts.TypeFlags.Any`) para cada declaração acima.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import * as prettier from "prettier";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const docPath = path.join(rootDir, "docs", "type-inference.md");
const checkMode = process.argv.includes("--check");

function compareText(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Ordena caminhos sem depender de ICU/locale: caixa baixa primeiro, depois caixa. */
function comparePath(a, b) {
  return compareText(a.toLowerCase(), b.toLowerCase()) || compareText(a, b);
}

/** @returns {string} caminho relativo com separadores POSIX. */
function relativePath(fileName) {
  return path.relative(rootDir, fileName).split(path.sep).join("/");
}

function loadProgram() {
  const configPath = ts.findConfigFile(rootDir, ts.sys.fileExists, "tsconfig.json");
  if (!configPath) throw new Error("tsconfig.json não encontrado");

  const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
  if (configFile.error) {
    throw new Error(ts.flattenDiagnosticMessageText(configFile.error.messageText, "\n"));
  }

  const parsed = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(configPath),
    undefined,
    configPath,
  );

  const analyzedFiles = parsed.fileNames
    .filter((fileName) => !fileName.endsWith(".d.ts"))
    .filter((fileName) => {
      const relative = path.relative(rootDir, fileName);
      return !relative.startsWith("..") && relative.split(path.sep)[0] === "src";
    })
    .sort((a, b) => comparePath(relativePath(a), relativePath(b)));

  // O programa usa todos os arquivos do projeto (inclusive `.d.ts` locais) para
  // que augmentations, como `express.d.ts`, participem da checagem de tipos.
  const program = ts.createProgram({ rootNames: parsed.fileNames, options: parsed.options });
  return { program, checker: program.getTypeChecker(), analyzedFiles };
}

/** @param {ts.Type} type */
function isAnyType(type) {
  return (type.flags & ts.TypeFlags.Any) !== 0;
}

/** @param {ts.BindingName} name */
function bindingNameHasAnyType(checker, name) {
  if (isAnyType(checker.getTypeAtLocation(name))) return true;
  if (!ts.isBindingPattern(name)) return false;

  return name.elements.some((element) => {
    if (ts.isOmittedExpression(element)) return false;
    return bindingNameHasAnyType(checker, element.name);
  });
}

/** @param {ts.Node} node */
function functionReturnHasAnyType(checker, node) {
  const signature = checker.getSignatureFromDeclaration(node);
  if (!signature) return false;
  return isAnyType(checker.getReturnTypeOfSignature(signature));
}

/** @param {ts.SignatureDeclaration} node */
function functionLabel(node) {
  if (node.name && (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name))) {
    return `${node.name.text}()`;
  }
  return "<anônima>()";
}

/** @param {string} text */
function singleLine(text) {
  return text.replace(/\s+/g, " ").trim();
}

function collectFile(fileName, sourceFile, checker) {
  const namedTypes = [];
  const declarations = [];

  const lineOf = (node) =>
    sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;

  const addDeclaration = (node, kind, name, hasAny) => {
    declarations.push({ line: lineOf(node), kind, name, hasAny });
  };

  const visit = (node) => {
    if (ts.isInterfaceDeclaration(node)) {
      namedTypes.push({
        line: lineOf(node),
        kind: "interface",
        name: node.name.text,
        text: node.getText(sourceFile),
      });
    } else if (ts.isTypeAliasDeclaration(node)) {
      namedTypes.push({
        line: lineOf(node),
        kind: "alias",
        name: node.name.text,
        text: node.getText(sourceFile),
      });
    } else if (ts.isClassDeclaration(node)) {
      if (node.name) {
        namedTypes.push({
          line: lineOf(node),
          kind: "class",
          name: node.name.text,
          text: node.getText(sourceFile),
        });
      }
    } else if (ts.isEnumDeclaration(node)) {
      namedTypes.push({
        line: lineOf(node),
        kind: "enum",
        name: node.name.text,
        text: node.getText(sourceFile),
      });
    }

    if (ts.isVariableDeclaration(node) && node.type === undefined) {
      addDeclaration(
        node,
        "variable",
        singleLine(node.name.getText(sourceFile)),
        bindingNameHasAnyType(checker, node.name),
      );
    } else if (ts.isParameter(node) && node.type === undefined) {
      addDeclaration(
        node,
        "parameter",
        singleLine(node.name.getText(sourceFile)),
        bindingNameHasAnyType(checker, node.name),
      );
    } else if (
      (ts.isFunctionDeclaration(node) ||
        ts.isFunctionExpression(node) ||
        ts.isArrowFunction(node) ||
        ts.isMethodDeclaration(node) ||
        ts.isGetAccessorDeclaration(node)) &&
      node.type === undefined
    ) {
      addDeclaration(node, "return", functionLabel(node), functionReturnHasAnyType(checker, node));
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  return {
    fileName: relativePath(fileName),
    namedTypes: namedTypes.sort((a, b) => a.line - b.line || compareText(a.name, b.name)),
    declarations,
  };
}

function countExplicitAny(sourceFiles) {
  let total = 0;
  for (const sourceFile of sourceFiles) {
    const visit = (node) => {
      if (node.kind === ts.SyntaxKind.AnyKeyword) total += 1;
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
  }
  return total;
}

function plural(count, singular, pluralForm) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

/** @param {"variable" | "parameter" | "return"} kind */
function declarationLabel(kind) {
  if (kind === "variable") return "variável";
  if (kind === "parameter") return "parâmetro";
  return "retorno da função";
}

function render(files, totals) {
  const lines = [];

  lines.push("# Inventário de tipagens TypeScript", "");
  lines.push(
    "> Arquivo gerado por `npm run docs:types` a partir dos arquivos `src/**/*.ts` e do `tsconfig.json` do projeto. Não edite manualmente: rode o comando para atualizar. Não inclui dependências nem arquivos `.d.ts`.",
    "",
  );

  lines.push("## Resumo", "");
  lines.push(`- Arquivos-fonte analisados: **${totals.files}**.`);
  lines.push(
    `- Tipos nomeados: **${totals.namedTypes}** — ${plural(totals.interfaces, "interface", "interfaces")}, ${plural(totals.aliases, "alias `type`", "aliases `type`")}, ${plural(totals.classes, "classe", "classes")} e ${plural(totals.enums, "enum", "enums")}.`,
  );
  lines.push(
    `- Declarações sem anotação explícita: **${totals.declarations}** — ${plural(totals.variables, "variável", "variáveis")}, ${plural(totals.parameters, "parâmetro", "parâmetros")} e ${plural(totals.returns, "retorno de função/método", "retornos de funções/métodos")}.`,
  );
  lines.push(
    `- Declarações com tipo efetivo \`any\` detectado pelo checker: **${totals.anyDeclarations}**; ocorrências com a palavra-chave \`any\` explícita no código-fonte: **${totals.explicitAny}**.`,
  );
  lines.push(
    `- Arquivos com pelo menos uma declaração sem anotação: **${totals.filesWithDeclarations}**; arquivos sem ocorrências são omitidos das seções 2 e 3.`,
  );
  lines.push(
    `- Erros de typecheck no momento da geração: **${totals.typecheckErrors}** (mesmo \`tsconfig.json\`; 0 significa que \`npm run typecheck\` passa).`,
    "",
  );

  lines.push("## Como interpretar", "");
  lines.push(
    "- **Tipados:** as definições abaixo mostram os tipos nomeados (interfaces, aliases, classes e enums) como estão declarados no código. As anotações de propriedades e membros aparecem nas próprias definições.",
  );
  lines.push(
    "- **Sem anotação explícita:** a declaração não traz `: Tipo` no local indicado. Isso **não** significa necessariamente falta de tipo: o compilador pode inferi-lo pelo inicializador, contexto ou assinatura. A lista inclui variáveis (inclusive destructuring, `for...of`/`for...in` e variável de `catch`), parâmetros e retornos de funções, métodos e getters.",
  );
  lines.push(
    "- **`any`:** o checker determinou tipo efetivo `any` para os itens listados. Em destructuring, o item é marcado quando o padrão ou qualquer elemento tem tipo `any`. A lista deve ser revisada priorizando as fronteiras com bibliotecas e APIs sem tipo suficientemente específico.",
  );
  lines.push(
    "- **Linhas:** referem-se ao estado do código no momento da geração. Como os números mudam a cada alteração em `src/`, valide com `npm run docs:types:check` antes de publicar mudanças de tipagem.",
    "",
  );

  lines.push("## 1. Tipos nomeados e suas definições", "");
  for (const file of files) {
    if (file.namedTypes.length === 0) continue;
    lines.push(`### [${file.fileName}](../${file.fileName})`, "");
    for (const type of file.namedTypes) {
      lines.push(`#### L${type.line} — ${type.kind} ${type.name}`, "");
      lines.push("```ts", type.text, "```", "");
    }
  }

  lines.push("## 2. Declarações sem anotação explícita", "");
  for (const file of files) {
    if (file.declarations.length === 0) continue;
    lines.push(`### [${file.fileName}](../${file.fileName})`, "");
    const sorted = [...file.declarations].sort(
      (a, b) => a.line - b.line || compareText(a.kind, b.kind) || compareText(a.name, b.name),
    );
    for (const declaration of sorted) {
      lines.push(
        `- L${declaration.line} — ${declarationLabel(declaration.kind)}: \`${declaration.name}\``,
      );
    }
    lines.push("");
  }

  const anyFiles = files
    .map((file) => ({
      ...file,
      anyDeclarations: file.declarations.filter((declaration) => declaration.hasAny),
    }))
    .filter((file) => file.anyDeclarations.length > 0);

  lines.push("## 3. Declarações com tipo efetivo `any`", "");
  for (const file of anyFiles) {
    lines.push(`### [${file.fileName}](../${file.fileName})`, "");
    const sorted = [...file.anyDeclarations].sort(
      (a, b) => a.line - b.line || compareText(a.kind, b.kind) || compareText(a.name, b.name),
    );
    for (const declaration of sorted) {
      lines.push(
        `- L${declaration.line} — ${declarationLabel(declaration.kind)}: \`${declaration.name}\``,
      );
    }
    lines.push("");
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}

async function formatDocument(markdown) {
  const config = (await prettier.resolveConfig(docPath)) ?? {};
  return prettier.format(markdown, { ...config, parser: "markdown" });
}

async function main() {
  const { program, checker, analyzedFiles } = loadProgram();
  const analyzedSet = new Set(analyzedFiles.map((fileName) => path.resolve(fileName)));
  const sourceFiles = program
    .getSourceFiles()
    .filter((sourceFile) => analyzedSet.has(path.resolve(sourceFile.fileName)));

  const files = sourceFiles
    .map((sourceFile) => collectFile(sourceFile.fileName, sourceFile, checker))
    .sort((a, b) => comparePath(a.fileName, b.fileName));

  const totals = {
    files: analyzedFiles.length,
    interfaces: files.reduce(
      (sum, file) => sum + file.namedTypes.filter((t) => t.kind === "interface").length,
      0,
    ),
    aliases: files.reduce(
      (sum, file) => sum + file.namedTypes.filter((t) => t.kind === "alias").length,
      0,
    ),
    classes: files.reduce(
      (sum, file) => sum + file.namedTypes.filter((t) => t.kind === "class").length,
      0,
    ),
    enums: files.reduce(
      (sum, file) => sum + file.namedTypes.filter((t) => t.kind === "enum").length,
      0,
    ),
  };
  totals.namedTypes = totals.interfaces + totals.aliases + totals.classes + totals.enums;
  totals.variables = files.reduce(
    (sum, file) => sum + file.declarations.filter((d) => d.kind === "variable").length,
    0,
  );
  totals.parameters = files.reduce(
    (sum, file) => sum + file.declarations.filter((d) => d.kind === "parameter").length,
    0,
  );
  totals.returns = files.reduce(
    (sum, file) => sum + file.declarations.filter((d) => d.kind === "return").length,
    0,
  );
  totals.declarations = totals.variables + totals.parameters + totals.returns;
  totals.anyDeclarations = files.reduce(
    (sum, file) => sum + file.declarations.filter((d) => d.hasAny).length,
    0,
  );
  totals.explicitAny = countExplicitAny(sourceFiles);
  totals.filesWithDeclarations = files.filter((file) => file.declarations.length > 0).length;
  totals.typecheckErrors = ts
    .getPreEmitDiagnostics(program)
    .filter(
      (diagnostic) => diagnostic.file && analyzedSet.has(path.resolve(diagnostic.file.fileName)),
    ).length;

  const markdown = await formatDocument(render(files, totals));

  if (checkMode) {
    const current = fs.existsSync(docPath)
      ? fs.readFileSync(docPath, "utf8").replace(/\r\n/g, "\n")
      : "";
    if (current !== markdown) {
      console.error(
        "docs/type-inference.md está desatualizado em relação ao código. Rode `npm run docs:types`.",
      );
      process.exit(1);
    }
    console.log("docs/type-inference.md está atualizado.");
    return;
  }

  fs.writeFileSync(docPath, markdown, "utf8");
  console.log(
    `docs/type-inference.md gerado: ${totals.files} arquivos, ${totals.namedTypes} tipos nomeados, ${totals.declarations} declarações sem anotação, ${totals.anyDeclarations} com any efetivo.`,
  );
}

await main();
