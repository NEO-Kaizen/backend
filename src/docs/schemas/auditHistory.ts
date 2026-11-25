export const AuditActor = {
  type: "object",
  required: ["kind", "userId", "displayName"],
  properties: {
    kind: { type: "string", enum: ["system", "user"] },
    userId: { type: "integer", nullable: true },
    displayName: { type: "string", nullable: true },
  },
};

export const AuditHistorySummary = {
  type: "object",
  required: ["audit_id", "entity_type", "entity_type_label", "action_type", "actor", "occurred_at"],
  properties: {
    audit_id: { type: "integer", example: 1 },
    entity_type: {
      type: "string",
      description:
        "Valor persistido em `audit_history.entity_type`. O catálogo atual é `user`, `prioritization`, `request`, `mapping`, `settings`, `pending_item`; valores anteriores fora do catálogo continuam legíveis.",
      example: "request",
    },
    entity_type_label: { type: "string", example: "Usuários" },
    action_type: { type: "string", example: "request.status_change" },
    actor: { $ref: "#/components/schemas/AuditActor" },
    occurred_at: { type: "string", format: "date-time" },
  },
};

export const AuditHistoryListResponse = {
  type: "object",
  required: ["items", "total", "page", "limit"],
  properties: {
    items: { type: "array", items: { $ref: "#/components/schemas/AuditHistorySummary" } },
    total: { type: "integer", example: 120 },
    page: { type: "integer", example: 1 },
    limit: { type: "integer", example: 20 },
  },
};

export const AuditHistoryDetail = {
  type: "object",
  required: [
    "audit_id",
    "entity_type",
    "entity_id",
    "action_type",
    "actor",
    "previous_value",
    "new_value",
    "note",
    "last_technical_message",
    "ip_address",
    "change_origin",
    "occurred_at",
  ],
  properties: {
    audit_id: { type: "integer" },
    entity_type: { type: "string" },
    entity_id: { type: "string" },
    action_type: { type: "string" },
    actor: { $ref: "#/components/schemas/AuditActor" },
    previous_value: { type: "string", nullable: true },
    new_value: { type: "string", nullable: true },
    note: { type: "string", nullable: true, description: "Justificativa interna da transição." },
    last_technical_message: {
      type: "string",
      nullable: true,
      description: "Snapshot do retorno público da transição.",
    },
    previous_meeting: {
      type: "object",
      description:
        "Reunião legada arquivada no evento request.reopen, quando não havia mapeamento correspondente.",
      required: ["scheduledFor", "link"],
      properties: {
        scheduledFor: { type: "string", format: "date-time", nullable: true },
        link: { type: "string", nullable: true },
      },
    },
    ip_address: { type: "string", nullable: true },
    change_origin: { type: "string", nullable: true },
    occurred_at: { type: "string", format: "date-time" },
  },
};
