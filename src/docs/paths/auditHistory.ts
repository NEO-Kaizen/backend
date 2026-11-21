const json = (ref: string) => ({
  content: { "application/json": { schema: { $ref: `#/components/schemas/${ref}` } } },
});

const error = (description: string) => ({
  description,
  ...json("ErrorResponse"),
});

export default {
  "/audit-history": {
    get: {
      tags: ["Auditoria"],
      summary: "Listar histórico de auditoria",
      description:
        "Lista paginada dos eventos de auditoria, ordenada por `occurred_at DESC`. Query é estrita (parâmetro desconhecido → `400`). `total` é a contagem antes da paginação; `page`/`limit` ecoam os valores aplicados. Perfis: Administrador ou Gestor. Respostas com `Cache-Control: private, no-store`.",
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
      summary: "Timeline de auditoria por protocolo",
      description:
        "Lista os eventos de auditoria de uma solicitação, com `Cache-Control: private, no-store`. Perfis internos; Analista precisa ser responsável (triagem ou mapeamento).",
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
};
