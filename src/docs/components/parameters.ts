export const protocolParam = {
  name: "protocol",
  in: "path",
  required: true,
  description: "Protocolo de rastreio (ex.: MAAT-8K3P-9X2M).",
  schema: { type: "string", example: "MAAT-8K3P-9X2M" },
};

export const requesterIdentityHeaderParam = {
  name: "X-Requester-Identity",
  in: "header",
  required: false,
  description:
    'JSON `{"name":"...","email":"..."}` verificado previamente em `POST .../public/verify`.',
  schema: { type: "string" },
  example: '{"name":"Maria Silva","email":"maria.silva@empresa.com"}',
};
