import { describe, expect, it } from "vitest";
import { resolveRole } from "../../src/shared/utils/roleUtils.ts";
import { normalizeEmail, normalizeName } from "../../src/shared/utils/normalizeIdentity.ts";
import { canonicalJson } from "../../src/shared/utils/json.ts";
import {
  normalizeIsoDate,
  normalizeIsoDateOnly,
  toDateOnly,
  toDateTimeMinutes,
} from "../../src/shared/utils/date.ts";
import {
  comparePassword,
  generateTemporaryPassword,
  hashPassword,
} from "../../src/shared/utils/passwordHandler.ts";
import { generateToken, verifyToken } from "../../src/shared/utils/jwtUtil.ts";
import { makeTokenPayload } from "../helpers/factories.ts";

describe("roleUtils.resolveRole", () => {
  it("mapeia o nome do perfil (case-insensitive) para a Role de exibição", () => {
    expect(resolveRole("analista")).toBe("Analista");
    expect(resolveRole("  ADMINISTRADOR ")).toBe("Administrador");
    expect(resolveRole("Solicitante")).toBe("Solicitante");
  });

  it("lança AppError 500 para perfil desconhecido", () => {
    expect(() => resolveRole("superuser")).toThrowError("Perfil inválido");
    try {
      resolveRole("superuser");
    } catch (error) {
      expect((error as { statusCode: number }).statusCode).toBe(500);
    }
  });
});

describe("normalizeIdentity", () => {
  it("remove acentos, faz trim e minúsculas (sem colapsar espaços internos)", () => {
    expect(normalizeName("  José da Silva ")).toBe("jose da silva");
  });

  it("normaliza e-mail (trim + lowercase)", () => {
    expect(normalizeEmail("  Maria@NEO.com ")).toBe("maria@neo.com");
  });
});

describe("json.canonicalJson", () => {
  it("ordena chaves de objetos aninhados de forma determinística", () => {
    const a = canonicalJson({ b: 1, a: { d: 2, c: 3 } });
    const b = canonicalJson({ a: { c: 3, d: 2 }, b: 1 });
    expect(a).toBe(b);
    expect(a).toBe('{"a":{"c":3,"d":2},"b":1}');
  });

  it("preserva a ordem de arrays", () => {
    expect(canonicalJson([3, 1, 2])).toBe("[3,1,2]");
  });
});

describe("date helpers", () => {
  it("normalizeIsoDate devolve ISO UTC ou null", () => {
    expect(normalizeIsoDate("2026-01-01T00:00:00.000Z")).toBe("2026-01-01T00:00:00.000Z");
    expect(normalizeIsoDate("")).toBeNull();
    expect(normalizeIsoDate("não é data")).toBeNull();
  });

  it("normalizeIsoDateOnly aceita yyyy-mm-dd e converte Date", () => {
    expect(normalizeIsoDateOnly("2026-05-09")).toBe("2026-05-09");
    expect(normalizeIsoDateOnly("valor inválido")).toBeNull();
  });

  it("toDateOnly e toDateTimeMinutes preservam componentes locais", () => {
    const date = new Date(2026, 4, 9, 8, 5);
    expect(toDateOnly(date)).toBe("2026-05-09");
    expect(toDateTimeMinutes(date)).toBe("2026-05-09T08:05");
    expect(toDateOnly("2026-05-09T10:00:00Z")).toBe("2026-05-09");
  });
});

describe("passwordHandler", () => {
  it("gera hash verificável e compara corretamente", async () => {
    const hash = await hashPassword("Senha@123");
    expect(hash).not.toBe("Senha@123");
    await expect(comparePassword("Senha@123", hash)).resolves.toBe(true);
    await expect(comparePassword("outra", hash)).resolves.toBe(false);
  });

  it("generateTemporaryPassword respeita o comprimento mínimo e é aleatória", () => {
    const first = generateTemporaryPassword();
    const second = generateTemporaryPassword();
    expect(first.length).toBeGreaterThanOrEqual(8);
    expect(first).not.toBe(second);
  });
});

describe("jwtUtil", () => {
  it("gera e verifica um token com o payload íntegro", () => {
    const token = generateToken(makeTokenPayload({ id: "42", role: "Gestor" }));
    const decoded = verifyToken(token);
    expect(decoded.id).toBe("42");
    expect(decoded.role).toBe("Gestor");
    expect(decoded.scope).toBe("session");
  });

  it("rejeita token adulterado", () => {
    const token = generateToken(makeTokenPayload());
    expect(() => verifyToken(`${token}x`)).toThrow();
  });
});
