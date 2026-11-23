export const ErrorResponse = {
  type: "object",
  required: ["status", "statusCode", "message"],
  properties: {
    status: { type: "string", example: "error" },
    statusCode: { type: "integer", example: 400 },
    message: { type: "string", example: "E-mail ou senha ausentes." },
    code: {
      type: "string",
      description: "Código estável opcional para a UI.",
      example: "INSUFFICIENT_ROLE_PERMISSIONS",
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
