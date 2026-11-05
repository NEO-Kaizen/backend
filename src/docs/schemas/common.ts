export const ErrorResponse = {
  type: "object",
  required: ["status", "statusCode", "message"],
  properties: {
    status: { type: "string", example: "error" },
    statusCode: { type: "integer", example: 400 },
    message: { type: "string", example: "E-mail ou senha ausentes." },
  },
};

export const ValidationErrorResponse = {
  type: "object",
  required: ["status", "statusCode", "message", "fields"],
  properties: {
    status: { type: "string", example: "error" },
    statusCode: { type: "integer", example: 400 },
    message: { type: "string", example: "Erro de validação." },
    fields: {
      type: "object",
      additionalProperties: { type: "string" },
      example: { email: "Informe um e-mail válido." },
    },
  },
};
