import { protocolParam } from "../components/parameters.ts";
import { error, json } from "../components/responses.ts";

export default {
  "/audit-history": {
    get: {
      tags: ["Auditoria"],
      summary: "Listar trilha de auditoria",
      description:
        "Lista paginada dos eventos de auditoria, ordenada por `occurred_at DESC`. Query é estrita (parâmetro desconhecido → `400`). `total` é a contagem antes da paginação; `page`/`limit` ecoam os valores aplicados. Exige `audit:read`. Em Custódia `assigned`, a listagem traz apenas eventos ligados às solicitações do Responsável corrente; `all` vê todas as entidades. Respostas com `Cache-Control: private, no-store`.",
      operationId: "listAuditHistory",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "page",
          in: "query",
          required: false,
          schema: { type: "integer", minimum: 1, default: 1 },
        },
        {
          name: "limit",
          in: "query",
          required: false,
          schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
        },
        {
          name: "entityType",
          in: "query",
          required: false,
          description: "Filtra por entidade do catálogo de auditoria.",
          schema: {
            type: "string",
            enum: ["user", "prioritization", "request", "mapping", "settings", "pending_item"],
          },
        },
      ],
      responses: {
        "200": { description: "Página de eventos.", ...json("AuditHistoryListResponse") },
        "400": error("Query inválida."),
        "401": error("Sem sessão ou token inválido."),
        "403": error("Sessão sem `audit:read`."),
      },
    },
  },

  "/audit-history/{id}": {
    get: {
      tags: ["Auditoria"],
      summary: "Consultar detalhe de auditoria",
      description:
        "Retorna o evento completo, incluindo valores anterior/novo e metadados. Exige `audit:read`; registro fora da Custódia `assigned` responde 404 sem revelar existência.",
      operationId: "getAuditHistoryDetail",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "integer", minimum: 1, example: 1 },
        },
      ],
      responses: {
        "200": { description: "Detalhe do evento.", ...json("AuditHistoryDetail") },
        "400": error("ID inválido (inteiro >= 1)."),
        "401": error("Sem sessão ou token inválido."),
        "403": error("Sessão sem `audit:read`."),
        "404": error("Registro não encontrado ou fora da Custódia do ator."),
      },
    },
  },

  "/audit-logs/{protocol}": {
    get: {
      tags: ["Auditoria"],
      summary: "Linha do tempo de auditoria por protocolo",
      description:
        "Lista os eventos de auditoria de uma solicitação, com `Cache-Control: private, no-store`. Exige `audit:read` sob Custódia do Responsável corrente; `all` dispensa o filtro de linha.",
      operationId: "getAuditLogsByProtocol",
      security: [{ cookieAuth: [] }],
      parameters: [protocolParam],
      responses: {
        "200": {
          description: "Eventos de auditoria da solicitação.",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: { $ref: "#/components/schemas/AuditHistoryDetail" },
              },
            },
          },
        },
        "400": error("Protocolo vazio."),
        "401": error("Sem sessão ou token inválido."),
        "403": error("Sessão sem `audit:read`."),
        "404": error("Protocolo inexistente ou fora da Custódia do ator."),
      },
    },
  },
};
