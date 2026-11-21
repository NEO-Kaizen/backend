const json = (ref: string) => ({
  content: { "application/json": { schema: { $ref: `#/components/schemas/${ref}` } } },
});

const error = (description: string) => ({
  description,
  ...json("ErrorResponse"),
});

const protocolParam = {
  name: "protocol",
  in: "path",
  required: true,
  schema: { type: "string", example: "MAAT-8K3P-9X2M" },
};

export default {
  "/requests/{protocol}/internal-notes": {
    get: {
      tags: ["Notas internas"],
      summary: "Listar timeline de observações internas",
      description:
        "Página da timeline unificada (notas + eventos de auditoria selecionados + históricos completos de triagem/mapeamento). " +
        "Ordem mais recente primeiro, cursor keyset opaco. `unseenCount` conta somente notas de outros autores.",
      operationId: "listInternalNotes",
      security: [{ cookieAuth: [] }],
      parameters: [
        protocolParam,
        {
          name: "limit",
          in: "query",
          required: false,
          schema: { type: "integer", minimum: 1, maximum: 50, default: 20 },
        },
        {
          name: "cursor",
          in: "query",
          required: false,
          description: "Cursor opaco devolvido em `nextCursor`.",
          schema: { type: "string" },
        },
      ],
      responses: {
        "200": { description: "Página da timeline.", ...json("InternalNotesResponse") },
        "400": error("Protocolo, `limit` ou cursor inválido."),
        "401": error("Sem sessão ou token inválido."),
        "403": error("Perfil Solicitante."),
        "404": error("Solicitação não encontrada."),
      },
    },
    post: {
      tags: ["Notas internas"],
      summary: "Publicar nota interna",
      description: "Cria uma nota imutável na timeline. Exige perfil interno.",
      operationId: "createInternalNote",
      security: [{ cookieAuth: [] }],
      parameters: [protocolParam],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateInternalNoteRequest" },
          },
        },
      },
      responses: {
        "201": { description: "Nota criada.", ...json("TimelineNote") },
        "400": error("Conteúdo vazio ou acima de 4000 caracteres."),
        "401": error("Sem sessão ou token inválido."),
        "403": error("Perfil Solicitante."),
        "404": error("Solicitação não encontrada."),
      },
    },
  },

  "/requests/{protocol}/internal-notes/read": {
    put: {
      tags: ["Notas internas"],
      summary: "Marcar notas internas como vistas",
      description:
        "Grava o checkpoint de leitura do usuário autenticado. A nota precisa pertencer à solicitação.",
      operationId: "markInternalNotesRead",
      security: [{ cookieAuth: [] }],
      parameters: [protocolParam],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/MarkInternalNotesReadRequest" },
          },
        },
      },
      responses: {
        "204": { description: "Checkpoint atualizado (sem corpo)." },
        "400": error("Payload inválido ou nota de outra solicitação."),
        "401": error("Sem sessão ou token inválido."),
        "403": error("Perfil Solicitante."),
        "404": error("Solicitação não encontrada."),
      },
    },
  },
};
