export const ErrorResponse = {
  type: "object",
  required: ["status", "statusCode", "message"],
  properties: {
    status: { type: "string", example: "error" },
    statusCode: { type: "integer", example: 400 },
    message: { type: "string", example: "E-mail ou senha ausentes." },
    code: {
      type: "string",
      description:
        "Código estável opcional para a UI. Códigos do RBAC: `request_not_found` (linha inexistente ou fora da Custódia/Posse), `assignee_not_assignable` (alvo de atribuição inválido) e `request_status_override_required` (alvo restrito ou fora do modo `free` sem `request:status_override`).",
      example: "assignee_not_assignable",
    },
    fields: {
      type: "object",
      additionalProperties: { type: "string" },
      description: "Erros por campo, quando aplicável.",
      example: { email: "Informe um e-mail válido." },
    },
  },
};

export const ValidationErrorResponse = {
  type: "object",
  required: ["status", "statusCode", "message"],
  properties: {
    status: { type: "string", example: "error" },
    statusCode: { type: "integer", example: 422 },
    message: { type: "string", example: "Erro de validação." },
    code: {
      type: "string",
      description: "Código estável opcional para a UI.",
    },
    fields: {
      type: "object",
      additionalProperties: { type: "string" },
      description: "Erros por campo.",
      example: { email: "Informe um e-mail válido." },
    },
  },
};
