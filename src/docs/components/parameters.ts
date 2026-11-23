export const protocolParam = {
  name: "protocol",
  in: "path",
  required: true,
  description: "Protocolo de rastreio (ex.: MAAT-8K3P-9X2M).",
  schema: { type: "string", example: "MAAT-8K3P-9X2M" },
};
