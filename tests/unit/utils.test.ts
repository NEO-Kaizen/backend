import { describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import Config from "../../src/configs.ts";
import { normalizeEmail, normalizeName } from "../../src/shared/utils/normalizeIdentity.ts";
import { canonicalJson } from "../../src/shared/utils/json.ts";
import {
  normalizeIsoDate,
  normalizeIsoDateOnly,
  toDateOnly,
  toDateTimeMinutes,
  toSaoPauloDateOnly,
} from "../../src/shared/utils/date.ts";
import {
  comparePassword,
  generateTemporaryPassword,
  hashPassword,
} from "../../src/shared/utils/passwordHandler.ts";
import { generateToken, verifyToken } from "../../src/shared/utils/jwtUtil.ts";
import { makeTokenPayload } from "../helpers/factories.ts";

describe("normalizeIdentity", () => {
  it("remove acentos, faz trim e minúsculas (sem colapsar espaços internos)", () => {
    expect(normalizeName("  José da Silva ")).toBe("jose da silva");
    expect(normalizeName("José   da  Silva")).toBe("jose   da  silva");
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
    expect(normalizeIsoDateOnly(new Date(2026, 4, 9, 12))).toBe("2026-05-09");
    expect(normalizeIsoDateOnly("valor inválido")).toBeNull();
  });

  it("toDateOnly e toDateTimeMinutes preservam componentes locais", () => {
    const date = new Date(2026, 4, 9, 8, 5);
    expect(toDateOnly(date)).toBe("2026-05-09");
    expect(toDateTimeMinutes(date)).toBe("2026-05-09T08:05");
    expect(toDateOnly("2026-05-09T10:00:00Z")).toBe("2026-05-09");
  });

  it("toSaoPauloDateOnly não desloca o dia nas viradas de fuso", () => {
    expect(toSaoPauloDateOnly("2026-05-10T02:00:00Z")).toBe("2026-05-09");
    expect(toSaoPauloDateOnly("2026-05-10T03:00:00Z")).toBe("2026-05-10");
    expect(toSaoPauloDateOnly("valor inválido")).toBeNull();
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
  it("gera e verifica um token com o payload íntegro (sem papel no JWT)", () => {
    const token = generateToken(makeTokenPayload({ id: "42", name: "Usuário Fictício" }));
    const decoded = verifyToken(token);
    expect(decoded.id).toBe("42");
    expect(decoded.name).toBe("Usuário Fictício");
    expect(decoded.scope).toBe("session");
    expect(decoded).not.toHaveProperty("role");
  });

  it("rejeita token adulterado", () => {
    const token = generateToken(makeTokenPayload());
    expect(() => verifyToken(`${token}x`)).toThrow();
  });

  it("rejeita payload assinado estruturalmente inválido", () => {
    const secret = Config.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET ausente no ambiente de teste");

    const valid = makeTokenPayload();
    const invalidPayloads: Array<Record<string, unknown>> = [
      { ...valid, password_changed_at: "2026-01-01" },
      { ...valid, password_changed_at: Number.NaN },
      { ...valid, id: 1 },
      { ...valid, email: 42 },
      { ...valid, name: undefined },
    ];

    for (const payload of invalidPayloads) {
      const token = jwt.sign(payload, secret, { expiresIn: "1d" });
      expect(() => verifyToken(token)).toThrow();
    }
  });

  it("normaliza escopo desconhecido para session", () => {
    const secret = Config.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET ausente no ambiente de teste");
    const token = jwt.sign({ ...makeTokenPayload(), scope: "root" }, secret, { expiresIn: "1d" });

    expect(verifyToken(token).scope).toBe("session");
  });
});
