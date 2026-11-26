import { DemandBlock } from "./request.ts";

/**
 * Contrato do Alerta de duplicidade (RF16 — issue #209).
 *
 * O item expõe exatamente seis chaves públicas. Nunca há Protocolo, score,
 * total, contagem, Notas internas, Triagem, Prioridade, Responsável, Anexos ou
 * PII. Regras em `docs/rules/duplicate-detection.md`.
 */
export const DuplicateCheckDemand = {
  ...DemandBlock,
  additionalProperties: false,
};

export const DuplicateCheckRequest = {
  type: "object",
  required: ["demand"],
  additionalProperties: false,
  properties: {
    demand: { $ref: "#/components/schemas/DuplicateCheckDemand" },
  },
};

export const DuplicateAlertItem = {
  type: "object",
  required: ["publicId", "title", "summary", "category", "status", "period"],
  additionalProperties: false,
  properties: {
    publicId: {
      type: "string",
      format: "uuid",
      description: "Identificador público aleatório, independente do Protocolo.",
      example: "8f14e45f-ea3a-4b2c-9c1d-1f7a5e6b2c90",
    },
    title: {
      type: "string",
      maxLength: 200,
      example: "Solicitação de Automação em andamento",
    },
    summary: {
      type: "string",
      example: "Solicitação em andamento da categoria Automação, registrada no período 2026-Q4.",
    },
    category: { type: "string", maxLength: 80, example: "Automação" },
    status: { type: "string", maxLength: 100, example: "Em andamento" },
    period: {
      type: "string",
      pattern: "^\\d{4}-Q[1-4]$",
      example: "2026-Q4",
    },
  },
};

export const DuplicateCheckResponse = {
  type: "object",
  required: ["confidence", "items"],
  additionalProperties: false,
  properties: {
    confidence: {
      type: "string",
      enum: ["high", "medium", "none"],
      description:
        "Faixa do Alerta: alta (até 3 itens), média (até 5 itens) ou nenhuma (lista vazia).",
      example: "medium",
    },
    items: {
      type: "array",
      maxItems: 5,
      items: { $ref: "#/components/schemas/DuplicateAlertItem" },
    },
  },
};
