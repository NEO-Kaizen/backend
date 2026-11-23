export const PrioritizationCriterion = {
  type: "object",
  required: ["id", "name", "weight"],
  properties: {
    id: { type: "string", maxLength: 50, description: "`criterion_id` (chave de `notes`)." },
    name: { type: "string" },
    weight: { type: "number", minimum: 1, maximum: 10 },
  },
};

export const PrioritizationCriteriaList = {
  type: "object",
  required: ["criteria"],
  properties: {
    criteria: {
      type: "array",
      items: { $ref: "#/components/schemas/PrioritizationCriterion" },
    },
  },
};

export const EvaluatePrioritizationRequest = {
  type: "object",
  required: ["notes"],
  additionalProperties: false,
  properties: {
    notes: {
      type: "object",
      minProperties: 1,
      additionalProperties: { type: "integer", minimum: 1, maximum: 5 },
      description:
        "Nota 1..5 por `criterion_id`. O peso vem de `criteria.weight`, nunca do payload; chaves extras são descartadas.",
      example: { impacto_operacional: 4, urgencia: 5, complexidade_estimada: 2 },
    },
    justification: { type: "string", maxLength: 500 },
  },
};

export const EvaluatePrioritizationResponse = {
  type: "object",
  required: ["protocol", "score", "classification", "calculatedAt", "calculatedBy"],
  properties: {
    protocol: { type: "string" },
    score: { type: "number", multipleOf: 0.1, minimum: 10, maximum: 50 },
    classification: {
      type: "string",
      enum: ["Baixa", "Média", "Alta", "Crítica"],
    },
    calculatedAt: { type: "string", format: "date-time" },
    calculatedBy: { type: "integer" },
  },
};
