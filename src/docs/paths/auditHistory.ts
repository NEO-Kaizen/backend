export default {
  "/audit-history": {
    get: {
      tags: ["Auditoria"],
      summary: "Listar histórico de auditoria",
      description:
        "Lista o histórico de auditoria. Exige `audit:read`. Em Custódia `assigned`, a listagem traz apenas eventos ligados às solicitações do Responsável corrente; `all` vê todas as entidades.",
      operationId: "listAuditHistory",
      security: [{ cookieAuth: [] }],
      responses: {
        "200": {
          description: "Lista de registros de auditoria.",
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
          description: "Sessão sem `audit:read`.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/audit-history/{id}": {
    get: {
      tags: ["Auditoria"],
      summary: "Consultar detalhe de auditoria",
      description:
        "Consulta um registro específico de auditoria pelo ID. Exige `audit:read`. Em Custódia `assigned`, o registro precisa pertencer a uma solicitação do Responsável corrente; fora do recorte responde 404 sem revelar existência.",
      operationId: "getAuditHistoryDetail",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", example: "1" },
        },
      ],
      responses: {
        "200": {
          description: "Detalhe do registro de auditoria.",
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
          description: "Sessão sem `audit:read`.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "404": {
          description: "Registro não encontrado ou fora da Custódia do ator.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  "/audit-logs/{protocol}": {
    get: {
      tags: ["Auditoria"],
      summary: "Consultar logs de auditoria por protocolo",
      description:
        "Retorna a timeline de auditoria de uma solicitação. Exige `audit:read` sob Custódia do Responsável corrente; `all` dispensa o filtro de linha. Protocolo inexistente ou fora da Custódia responde 404 genérico.",
      operationId: "getAuditLogsByProtocol",
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
          description: "Timeline de auditoria da solicitação.",
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
          description: "Sessão sem `audit:read`.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "404": {
          description: "Protocolo inexistente ou fora da Custódia do ator.",
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
