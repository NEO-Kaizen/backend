import { describe, expect, it } from "vitest";
import {
  buildOpenRequestTemplate,
  OPEN_REQUEST_PUBLIC_STATUS,
  OPEN_REQUEST_REDACTION_VERSION,
  toSaoPauloQuarter,
} from "../../src/modules/duplicates/template.ts";

describe("template de Solicitação aberta", () => {
  it("materializa título e resumo sem texto livre", () => {
    const template = buildOpenRequestTemplate({
      category: "Automação",
      createdAt: new Date("2026-11-25T12:00:00.000Z"),
    });

    expect(template).toEqual({
      title: "Solicitação de Automação em andamento",
      summary: "Solicitação em andamento da categoria Automação, registrada no período 2026-Q4.",
      category: "Automação",
      status: OPEN_REQUEST_PUBLIC_STATUS,
      period: "2026-Q4",
      redactionVersion: OPEN_REQUEST_REDACTION_VERSION,
    });
  });

  it("calcula o trimestre no fuso America/Sao_Paulo, não em UTC", () => {
    // 01/10 02:30 UTC = 30/09 23:30 em São Paulo → ainda Q3.
    expect(toSaoPauloQuarter(new Date("2026-10-01T02:30:00.000Z"))).toBe("2026-Q3");
    // 01/10 03:00 UTC = 01/10 00:00 em São Paulo → Q4.
    expect(toSaoPauloQuarter(new Date("2026-10-01T03:00:00.000Z"))).toBe("2026-Q4");
  });

  it("cobre as bordas dos quatro trimestres", () => {
    expect(toSaoPauloQuarter("2026-01-15T12:00:00.000Z")).toBe("2026-Q1");
    expect(toSaoPauloQuarter("2026-04-01T12:00:00.000Z")).toBe("2026-Q2");
    expect(toSaoPauloQuarter("2026-07-01T12:00:00.000Z")).toBe("2026-Q3");
    expect(toSaoPauloQuarter("2026-12-31T12:00:00.000Z")).toBe("2026-Q4");
  });

  it("recusa data inválida", () => {
    expect(() => toSaoPauloQuarter("data-invalida")).toThrow("Data inválida");
  });
});
