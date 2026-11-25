import { describe, expect, it } from "vitest";
import { z } from "zod";
import { buildZodFieldErrors, formatZodIssues } from "../../src/shared/validation/zodErrors.ts";
import {
  emailSchema,
  isValidText,
  optionalString,
  passwordSchema,
  requiredString,
} from "../../src/shared/validation/fieldSchemas.ts";

describe("formatZodIssues", () => {
  it("lista campos obrigatórios ausentes", () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const parsed = schema.safeParse({});
    if (parsed.success) throw new Error("deveria falhar");

    const message = formatZodIssues(parsed.error);
    expect(message).toContain("Campos obrigatórios ausentes:");
    expect(message).toContain("name");
    expect(message).toContain("age");
  });

  it("traduz o erro de tipo e separa campos inválidos", () => {
    const schema = z.object({ name: z.string() });
    const parsed = schema.safeParse({ name: 123 });
    if (parsed.success) throw new Error("deveria falhar");

    const message = formatZodIssues(parsed.error);
    expect(message).toContain("Campos inválidos:");
    expect(message).toContain("name — Deve ser um texto.");
  });

  it("usa o rootLabel quando o path é vazio", () => {
    const parsed = z.string().safeParse(42);
    if (parsed.success) throw new Error("deveria falhar");
    expect(formatZodIssues(parsed.error, "payload")).toContain("payload");
  });
});

describe("buildZodFieldErrors", () => {
  it("devolve mapa de campos com mensagens por chave", () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const parsed = schema.safeParse({ age: "x" });
    if (parsed.success) throw new Error("deveria falhar");

    const { fields, message } = buildZodFieldErrors(parsed.error);
    expect(fields.name).toBe("Campo obrigatório.");
    expect(fields.age).toBe("Deve ser um número.");
    expect(message).toContain("Campos obrigatórios ausentes: name");
  });

  it("aplica o mapa de chaves da UI (hasManualControls → hasManualControlsDetail)", () => {
    const schema = z.object({ operational: z.object({ hasManualControls: z.string() }) });
    const parsed = schema.safeParse({ operational: {} });
    if (parsed.success) throw new Error("deveria falhar");

    const { fields } = buildZodFieldErrors(parsed.error);
    expect(fields["operational.hasManualControlsDetail"]).toBe("Campo obrigatório.");
    expect(fields["operational.hasManualControls"]).toBeUndefined();
  });
});

describe("fieldSchemas", () => {
  it("requiredString faz trim e valida tamanho", () => {
    expect(requiredString(5).parse("  oi ")).toBe("oi");
    expect(requiredString(5).safeParse("").success).toBe(false);
    expect(requiredString(3).safeParse("abcd").success).toBe(false);
  });

  it("optionalString transforma string vazia em undefined", () => {
    expect(optionalString(10).parse("")).toBeUndefined();
    expect(optionalString(10).parse("  x ")).toBe("x");
    expect(optionalString(10).parse(undefined)).toBeUndefined();
  });

  it("emailSchema normaliza e valida", () => {
    expect(emailSchema.parse("  A@B.COM ")).toBe("a@b.com");
    expect(emailSchema.safeParse("invalido").success).toBe(false);
  });

  it("passwordSchema exige 8+ caracteres e no máximo 72 bytes", () => {
    expect(passwordSchema.safeParse("12345678").success).toBe(true);
    expect(passwordSchema.safeParse("1234567").success).toBe(false);
    expect(passwordSchema.safeParse("á".repeat(40)).success).toBe(false);
  });

  it("isValidText aceita letras/acentos/espaços e rejeita símbolos", () => {
    expect(isValidText("João da Silva")).toBe(true);
    expect(isValidText("João123")).toBe(false);
  });
});
