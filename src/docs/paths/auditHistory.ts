import { auditCatalog } from "../../shared/audit/auditCatalog.ts";

const auditEntityTypes = Object.keys(auditCatalog);

export default {
  "/audit-history": {
    get: {
      tags: ["Auditoria"],
      summary: "Listar histórico de auditoria",
      description:
        "Lista o histórico de auditoria. Exige autenticação e perfil Administrador ou Gestor.",
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
        "200": {
          description: "Lista paginada de registros de auditoria.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AuditHistoryListResponse" },
            },
          },
        },
        "400": {
          description: "Parâmetros de consulta inválidos.",
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
          description: "Perfil diferente de Administrador ou Gestor.",
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
        "Consulta um registro específico de auditoria pelo ID. Exige autenticação e perfil Administrador ou Gestor.",
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
              schema: { $ref: "#/components/schemas/AuditHistoryDetail" },
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
          description: "Perfil diferente de Administrador ou Gestor.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "404": {
          description: "Registro de auditoria não encontrado.",
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
        "Retorna a timeline de auditoria de uma solicitação. Exige autenticação e perfil interno (Analista, Gestor ou Administrador).",
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
              schema: {
                type: "array",
                items: { $ref: "#/components/schemas/AuditHistoryDetail" },
              },
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
          description: "Perfil sem acesso.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        "404": {
          description: "Protocolo inexistente.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
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
      },
    },
  },
};
