import { auditCatalog } from "../../shared/audit/auditCatalog.ts";
import { protocolParam } from "../components/parameters.ts";
import { error, json } from "../components/responses.ts";

const auditEntityTypes = Object.keys(auditCatalog);

export default {
  "/audit-history": {
    get: {
      tags: ["Auditoria"],
      summary: "Listar trilha de auditoria",
      description:
        "Lista paginada dos eventos de auditoria, ordenada por `occurred_at DESC`. Query é estrita (parâmetro desconhecido → `400`). `total` é a contagem antes da paginação; `page`/`limit` ecoam os valores aplicados. Perfis: Administrador ou Gestor. Respostas com `Cache-Control: private, no-store`.",
      operationId: "listAuditHistory",
      security: [{ cookieAuth: [] }],
      parameters: [
        {
          name: "page",
          in: "query",
          required: false,
          description: "Página solicitada (padrão: 1).",
          schema: { type: "integer", minimum: 1, default: 1, example: 1 },
        },
        {
          name: "limit",
          in: "query",
          required: false,
          description: "Itens por página (padrão: 20; máximo: 100).",
          schema: { type: "integer", minimum: 1, maximum: 100, default: 20, example: 20 },
        },
        {
          name: "entityType",
          in: "query",
          required: false,
          description: "Filtra pelo tipo de entidade auditada.",
          schema: { type: "string", enum: auditEntityTypes, example: "request" },
        },
      ],
      responses: {
        "200": { description: "Página de eventos.", ...json("AuditHistoryListResponse") },
        "400": error("Query inválida."),
        "401": error("Sem sessão ou token inválido."),
        "403": error("Perfil sem acesso (Administrador ou Gestor)."),
      },
    },
  },

  "/audit-history/{id}": {
    get: {
      tags: ["Auditoria"],
      summary: "Consultar detalhe de auditoria",
      description: "Retorna o evento completo, incluindo valores anterior/novo e metadados.",
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
        "403": error("Perfil sem acesso (Administrador ou Gestor)."),
        "404": error("Registro não encontrado."),
      },
    },
  },

  "/audit-logs/{protocol}": {
    get: {
      tags: ["Auditoria"],
      summary: "Linha do tempo de auditoria por protocolo",
      description:
        "Lista os eventos de auditoria de uma solicitação, com `Cache-Control: private, no-store`. Perfis internos; Analista precisa ser responsável (triagem ou mapeamento).",
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
        "403": error("Perfil ou custódia insuficiente."),
        "404": error("Protocolo inexistente."),
      },
    },
  },
  "/audit-logs/{protocol}/status-times": {
    get: {
      tags: ["Auditoria"],
      summary: "Consultar tempo por Status",
      description:
        "Retorna os intervalos ativos e pausados por Status de uma solicitação. Exige autenticação e acesso interno à solicitação.",
      operationId: "getStatusTimesByProtocol",
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
          description: "Tempo ativo e pausado por Status.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/StatusTimeResponse" },
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
          description: "Usuário sem custódia ou protocolo não visível ao Analista sem custódia.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "404": {
          description: "Protocolo inexistente para perfil Administrador ou Gestor.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "409": {
          description: "Histórico de Status divergente da solicitação.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: {
                status: "error",
                statusCode: 409,
                message: "A trilha de auditoria diverge do Status atual da solicitação.",
                code: "STATUS_HISTORY_DIVERGENCE",
              },
            },
          },
        },
      },
    },
  },
};
