export const protocolParam = {
  name: "protocol",
  in: "path",
  required: true,
  description: "Protocolo de rastreio (ex.: MAAT-8K3P-9X2M).",
  schema: { type: "string", example: "MAAT-8K3P-9X2M" },
};

export const searchParam = {
  name: "search",
  in: "query",
  required: false,
  description:
    "Busca parcial, case-insensitive, por protocolo, e-mail corporativo, nome do solicitante, " +
    "descrição, problema e conteúdo das notas internas. Em `GET /queue`, a correspondência em " +
    "notas exige a custódia de `internal_note:read`: o responsável de mapeamento amplia a fila, " +
    "mas não a busca por nota. Nas rotas restritas a Gestor/Administrador não há recorte por " +
    "responsável.",
  schema: { type: "string", maxLength: 254 },
};
