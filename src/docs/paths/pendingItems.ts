export default {
  "/requests/:protocol/pending-items": {
    get: {
      tags: ["Pendências"],
      summary: "Listar Pendências",
      description:
        "Lista as Pendências de uma solicitação via dual-auth (cookie ou header `X-Requester-Identity`).",
      operationId: "listPendingItems",
      security: [],
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
          description: "Lista de Pendências.",
          content: {
            "application/json": {
              schema: { type: "array", items: { type: "object" } },
            },
          },
        },
      },
    },
    post: {
      tags: ["Pendências"],
      summary: "Criar Pendências",
      description: "Cria Pendências para uma solicitação. Exige autenticação e perfil interno.",
      operationId: "createPendingItems",
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
        "201": {
          description: "Pendências criadas com sucesso.",
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
          description: "Perfil sem acesso.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
    patch: {
      tags: ["Pendências"],
      summary: "Revisar Pendências",
      description:
        "Revisa (aprova/rejeita) Pendências de uma solicitação. Exige autenticação e perfil interno.",
      operationId: "reviewPendingItems",
      security: [{ cookieAuth: [] }],
      responses: {
        "200": {
          description: "Pendências revisadas com sucesso.",
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
          description: "Perfil sem acesso.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/requests/:protocol/pending-items/:pendingItemId": {
    patch: {
      tags: ["Pendências"],
      summary: "Responder pendência",
      description:
        "Responde a uma pendência específica. Via dual-auth (cookie ou header `X-Requester-Identity`).",
      operationId: "respondPendingItem",
      security: [],
      parameters: [
        {
          name: "protocol",
          in: "path",
          required: true,
          schema: { type: "string", example: "MAAT-8K3P-9X2M" },
        },
        {
          name: "pendingItemId",
          in: "path",
          required: true,
          schema: { type: "string", example: "00000000-0000-4000-8000-000000000099" },
        },
      ],
      responses: {
        "200": {
          description: "Pendência respondida com sucesso.",
        },
      },
    },
    post: {
      tags: ["Pendências"],
      summary: "Anexar arquivo à pendência",
      description:
        "Anexa um arquivo a uma pendência. Via dual-auth (cookie ou header `X-Requester-Identity`).",
      operationId: "attachPendingItem",
      security: [],
      parameters: [
        {
          name: "protocol",
          in: "path",
          required: true,
          schema: { type: "string", example: "MAAT-8K3P-9X2M" },
        },
        {
          name: "pendingItemId",
          in: "path",
          required: true,
          schema: { type: "string", example: "00000000-0000-4000-8000-000000000099" },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              required: ["file"],
              properties: {
                file: { type: "string", format: "binary" },
              },
            },
          },
        },
      },
      responses: {
        "201": {
          description: "Anexo adicionado com sucesso.",
        },
        "400": {
          description: "Arquivo acima de 10 MB ou formato não permitido.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/requests/:protocol/public/verify": {
    post: {
      tags: ["Pendências"],
      summary: "Verificação pública de pendência",
      description: "Endpoint público para verificação de pendência sem autenticação (modo PUBLIC).",
      operationId: "publicVerify",
      security: [],
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
          description: "Verificação realizada com sucesso.",
        },
      },
    },
  },
};
