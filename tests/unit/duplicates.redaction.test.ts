import { describe, expect, it } from "vitest";
import {
  buildCompletedProjectionText,
  containsPersonalData,
} from "../../src/modules/duplicates/redact.ts";

const CREATED_AT = "2026-10-05T12:00:00.000Z";
const CATEGORY = "Automação";

function buildText(
  overrides: {
    title?: string;
    description?: string;
    problem?: string;
  } = {},
) {
  return buildCompletedProjectionText({
    title: overrides.title ?? "Automatizar conciliação bancária",
    description: overrides.description ?? "Conferência manual de extratos e lançamentos.",
    problem: overrides.problem ?? "Retrabalho e risco de divergência no fechamento.",
    category: CATEGORY,
    createdAt: CREATED_AT,
  });
}

describe("gate de PII do texto de concluídas", () => {
  it("publica título e resumo quando não há padrão de PII", () => {
    const result = buildText();

    expect(result).toEqual({
      title: "Automatizar conciliação bancária",
      summary:
        "Conferência manual de extratos e lançamentos.\n\nRetrabalho e risco de divergência no fechamento.",
      redactionVersion: "v1-regex",
    });
    expect(containsPersonalData(result.summary)).toBe(false);
  });

  it.each([
    ["CPF", "123.456.789-00"],
    ["CPF com espaços", "123 456 789 00"],
    ["CNPJ", "12.345.678/0001-90"],
    ["CNPJ com espaços", "12 345 678/0001 90"],
    ["e-mail", "maria.silva@empresa.com.br"],
    ["telefone com DDD", "(11) 99999-8888"],
    ["telefone com +55", "+55 11 3333-4444"],
    ["RG", "12.345.678-9"],
    ["RG com X", "12.345.678-X"],
    ["RG sem dígito verificador", "12.345.678"],
    ["RG espaçado", "12 345 678"],
    ["CEP", "01310-100"],
    ["CEP com espaço", "01310 100"],
    ["placa antiga", "ABC-1234"],
    ["placa antiga com espaço", "ABC 1234"],
    ["placa Mercosul", "ABC1D23"],
    ["sequência longa de dígitos", "12345678901"],
  ])("detecta %s", (_label, pii) => {
    expect(containsPersonalData(`Texto com ${pii} no meio.`)).toBe(true);
  });

  it("não trata ano ou número curto como PII", () => {
    expect(containsPersonalData("Fechamento de 2026 com 12345 lançamentos.")).toBe(false);
  });

  it("qualquer match no título ou no resumo derruba os dois para o template", () => {
    const result = buildText({
      title: "Ajuda para o CPF 123.456.789-00",
      description: "Descrição sem dado pessoal.",
      problem: "Problema sem dado pessoal.",
    });

    expect(result).toEqual({
      title: "Solicitação de Automação concluída",
      summary: "Solicitação concluída da categoria Automação, registrada no período 2026-Q4.",
      redactionVersion: "v1-regex",
    });
    expect(JSON.stringify(result)).not.toContain("123.456.789-00");
    expect(JSON.stringify(result)).not.toContain("Descrição sem dado pessoal.");
  });

  it("não faz mascaramento parcial quando o resumo tem e-mail", () => {
    const result = buildText({
      title: "Automatizar conciliação bancária",
      description: "Contato: financeiro@neo.com",
      problem: "Retrabalho no fechamento.",
    });

    expect(result.title).toBe("Solicitação de Automação concluída");
    expect(JSON.stringify(result)).not.toContain("financeiro@neo.com");
    expect(JSON.stringify(result)).not.toContain("Automatizar conciliação bancária");
  });
});
