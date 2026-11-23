/**
 * Histórico de auditoria — detalhe administrativo dos mesmos eventos da
 * timeline. O ator carrega snapshot de Perfil quando o evento o registrou.
 */
export const AuditActor = {
  type: "object",
  required: ["kind", "userId", "displayName", "profile"],
  properties: {
    kind: { type: "string", enum: ["system", "user"], example: "user" },
    userId: { type: "integer", nullable: true, example: 101 },
    displayName: { type: "string", nullable: true, example: "Maria Silva" },
    profile: {
      nullable: true,
      allOf: [{ $ref: "#/components/schemas/ProfileReference" }],
      description: "Snapshot do Perfil do ator; `null` em ações de sistema e eventos antigos.",
    },
  },
};

export const AuditHistorySummary = {
  type: "object",
  required: ["audit_id", "entity_type", "entity_type_label", "action_type", "actor", "occurred_at"],
  properties: {
    audit_id: { type: "integer", example: 900 },
    entity_type: { type: "string", example: "request" },
    entity_type_label: { type: "string", example: "Solicitações" },
    action_type: { type: "string", example: "request.status_change" },
    actor: { $ref: "#/components/schemas/AuditActor" },
    occurred_at: { type: "string", format: "date-time", example: "2026-11-23T12:00:00.000Z" },
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
    "denied_permission_keys",
    "occurred_at",
  ],
  properties: {
    audit_id: { type: "integer", example: 900 },
    entity_type: { type: "string", example: "request" },
    entity_id: { type: "string", example: "MAAT-8K3P-9X2M" },
    action_type: { type: "string", example: "request.access_denied" },
    actor: { $ref: "#/components/schemas/AuditActor" },
    previous_value: { type: "string", nullable: true },
    new_value: { type: "string", nullable: true },
    note: { type: "string", nullable: true, example: "Permissão ausente: request:read" },
    last_technical_message: { type: "string", nullable: true },
    ip_address: { type: "string", nullable: true, example: "203.0.113.10" },
    change_origin: { type: "string", nullable: true, example: "system" },
    denied_permission_keys: {
      type: "array",
      items: { type: "string" },
      example: ["request:read"],
      description:
        "Chaves de Permissão avaliadas na recusa (`*.access_denied`): ausentes no gate ou presentes sem o vínculo suficiente (Custódia ou Posse) na linha. Vazio nas demais ações — a chave que autorizou não é registrada.",
    },
    occurred_at: { type: "string", format: "date-time", example: "2026-11-23T12:00:00.000Z" },
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
