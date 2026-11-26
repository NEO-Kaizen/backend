import { describe, expect, it } from "vitest";
import {
  buildCompletedProjectionText,
  containsPersonalData,
} from "../../src/modules/duplicates/redact.ts";

const CREATED_AT = "2026-10-05T12:00:00.000Z";
const CATEGORY = "Automação";
const TEMPLATE_TITLE = "Solicitação de Automação concluída";
const TEMPLATE_SUMMARY =
  "Solicitação concluída da categoria Automação, registrada no período 2026-Q4.";

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
    ["CPF com separador duplo", "123.456.789 - 00"],
    ["CPF com espaços", "123 456 789 00"],
    ["CNPJ", "12.345.678/0001-90"],
    ["CNPJ com separador duplo", "12.345.678/0001 - 90"],
    ["CNPJ alfanumérico", "12.ABC.345/01DE-35"],
    ["CNPJ com espaços", "12 345 678/0001 90"],
    ["e-mail", "maria.silva@empresa.com.br"],
    ["telefone com DDD", "(11) 99999-8888"],
    ["telefone com DDD e separador duplo", "(11) 99999 - 8888"],
    ["telefone com +55", "+55 11 3333-4444"],
    ["celular sem DDD", "99999-8888"],
    ["RG", "12.345.678-9"],
    ["RG com X", "12.345.678-X"],
    ["RG de 8 dígitos", "12.345.678"],
    ["RG de 8 dígitos com espaço", "12 345 678"],
    ["RG de 8 dígitos com hífen", "12-345-678"],
    ["RG contextual de 8 dígitos", "RG 12.345.678"],
    ["RG contextual com espaços", "RG: 12 345 678"],
    ["CEP", "01310-100"],
    ["CEP com espaço", "01310 100"],
    ["CEP com separador duplo", "01310 - 100"],
    ["placa antiga", "ABC-1234"],
    ["placa antiga sem hífen", "ABC1234"],
    ["placa Mercosul", "ABC1D23"],
    ["placa antiga minúscula", "abc-1234"],
    ["placa Mercosul minúscula", "abc1d23"],
    ["placa antiga com espaço em caixa alta", "ABC 1234"],
    ["placa Mercosul com espaço em caixa alta", "ABC 1D23"],
    ["placa antiga com espaço e contexto", "placa ABC 1234"],
    ["placa antiga minúscula com contexto", "placa abc 1234"],
    ["veículo com placa espaçada", "veículo ABC 1234"],
    ["veículo com placa Mercosul espaçada", "veículo ABC 1D23"],
    ["veículo com placa Mercosul minúscula", "veículo abc1d23"],
    ["sequência longa de dígitos", "12345678901"],
  ])("detecta %s", (_label, pii) => {
    expect(containsPersonalData(`Texto com ${pii} no meio.`)).toBe(true);
  });

  it.each([
    ["intervalo de anos", "2026-2027"],
    ["ano sem preposição", "no ano 2026"],
    ["ano com clientes", "com 2026 clientes"],
    ["mil unidades", "por 1000 unidades"],
    ["valor em reais", "R$ 1.500.000"],
    ["milhões de registros", "2.000.000 de registros"],
    ["telefone 0800", "0800 123 4567"],
    ["token de três letras colado a quatro dígitos", "ano2026"],
    ["número curto", "12345"],
  ])("não trata %s como PII", (_label, text) => {
    expect(containsPersonalData(`Texto com ${text} no meio.`)).toBe(false);
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
      title: TEMPLATE_TITLE,
      summary: TEMPLATE_SUMMARY,
      redactionVersion: "v1-template",
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

    expect(result.title).toBe(TEMPLATE_TITLE);
    expect(JSON.stringify(result)).not.toContain("financeiro@neo.com");
    expect(JSON.stringify(result)).not.toContain("Automatizar conciliação bancária");
  });

  it("cai para o template quando o título fica vazio após trim", () => {
    const result = buildText({ title: "   " });

    expect(result).toEqual({
      title: TEMPLATE_TITLE,
      summary: TEMPLATE_SUMMARY,
      redactionVersion: "v1-template",
    });
  });

  it("cai para o template quando o resumo fica vazio após trim", () => {
    const result = buildText({ description: " ", problem: "" });

    expect(result).toEqual({
      title: TEMPLATE_TITLE,
      summary: TEMPLATE_SUMMARY,
      redactionVersion: "v1-template",
    });
  });
});
