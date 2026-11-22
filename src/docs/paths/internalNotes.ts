export default {
  "/requests/{protocol}/internal-notes": {
    get: {
      tags: ["Notas internas"],
      summary: "Listar notas internas",
      description:
        "Lista as notas internas e a Linha do tempo da solicitação. " +
        "Exige `internal_note:read` sob Custódia do Responsável corrente; `all` dispensa o filtro de linha.",
      operationId: "listInternalNotes",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "protocol",
          in: "path",
          required: true,
          schema: { type: "string", example: "MAAT-8K3P-9X2M" },
        },
      ],
      responses: {
        "200": {
          description: "Lista de notas internas.",
          content: {
            "application/json": {
              schema: { type: "array", items: { type: "object" } },
            },
          },
        },
        "401": {
          description: "Sem sessão ou token inválido.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "403": {
          description: "Sessão sem `internal_note:read`.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "404": {
          description: "Solicitação inexistente ou fora da Custódia do ator.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
    post: {
      tags: ["Notas internas"],
      summary: "Criar nota interna",
      description:
        "Cria uma nova nota interna para a solicitação. " +
        "Exige `internal_note:write` sob Custódia do Responsável corrente; a autoria vem da sessão.",
      operationId: "createInternalNote",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "protocol",
          in: "path",
          required: true,
          schema: { type: "string", example: "MAAT-8K3P-9X2M" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["content"],
              properties: {
                content: { type: "string", example: "Nota importante sobre a solicitação" },
              },
            },
          },
        },
      },
      responses: {
        "201": {
          description: "Nota interna criada com sucesso.",
          content: {
            "application/json": {
              schema: { type: "object" },
            },
          },
        },
        "401": {
          description: "Sem sessão ou token inválido.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "403": {
          description: "Sessão sem `internal_note:write`.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "404": {
          description: "Solicitação inexistente ou fora da Custódia do ator.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
    put: {
      tags: ["Notas internas"],
      summary: "Marcar notas internas como lidas",
      description:
        "Avança o checkpoint de leitura até a última nota carregada. " +
        "Exige `internal_note:read` sob Custódia do Responsável corrente.",
      operationId: "markInternalNotesRead",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "protocol",
          in: "path",
          required: true,
          schema: { type: "string", example: "MAAT-8K3P-9X2M" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["lastReadNoteId"],
              properties: {
                lastReadNoteId: { type: "string", example: "12" },
              },
            },
          },
        },
      },
      responses: {
        "204": {
          description: "Checkpoint de leitura atualizado.",
        },
        "400": {
          description: "ID de nota inválido ou de outra solicitação.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "401": {
          description: "Sem sessão ou token inválido.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "403": {
          description: "Sessão sem `internal_note:read`.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "404": {
          description: "Solicitação inexistente ou fora da Custódia do ator.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
};
