import { describe, expect, it } from "vitest";
import { generateProtocol } from "../../src/shared/protocol/generateProtocol.ts";

describe("generateProtocol", () => {
  it("gera o formato MAAT-XXXX-XXXX", () => {
    expect(generateProtocol(1)).toMatch(/^MAAT-[0-9A-Z]{4}-[0-9A-Z]{4}$/);
    expect(generateProtocol(12345)).toMatch(/^MAAT-[0-9A-Z]{4}-[0-9A-Z]{4}$/);
  });

  it("é determinístico para o mesmo id", () => {
    expect(generateProtocol(987)).toBe(generateProtocol(987));
  });

  it("não colide para ids consecutivos (bijeção do Feistel)", () => {
    const codes = new Set<string>();
    for (let id = 1; id <= 500; id += 1) {
      codes.add(generateProtocol(id));
    }
    expect(codes.size).toBe(500);
  });

  it("aceita bigint/string e rejeita id fora do domínio", () => {
    expect(generateProtocol(10n)).toBe(generateProtocol(10));
    expect(generateProtocol("10")).toBe(generateProtocol(10));
    expect(() => generateProtocol(0)).toThrowError(RangeError);
    expect(() => generateProtocol(-1)).toThrowError(RangeError);
  });
});
