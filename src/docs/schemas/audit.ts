export const AuditActor = {
  type: "object",
  required: ["kind", "userId", "displayName"],
  properties: {
    kind: { type: "string", enum: ["system", "user"], example: "user" },
    userId: { type: "integer", nullable: true, example: 102 },
    displayName: { type: "string", nullable: true, example: "Administrador Teste" },
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
    audit_id: { type: "integer", minimum: 1, example: 17 },
    entity_type: {
      type: "string",
      enum: ["request", "user", "mapping", "pending_item", "settings"],
      example: "request",
    },
    entity_id: { type: "string", example: "MAAT-8K3P-9X2M" },
    action_type: {
      type: "string",
      enum: [
        "request.status_change",
        "request.override_status_admin",
        "request.triage",
        "request.access_denied",
        "user.create",
        "user.activate",
        "user.deactivate",
        "user.reset_password",
        "user.change_password",
        "user.update_profile",
        "user.update",
        "prioritization.evaluate",
        "request.assign",
        "request.reassign",
        "request.unassign",
        "request.update",
        "mapping.assign",
        "mapping.save",
        "mapping.complete",
        "settings.update",
        "pending_item.create",
        "pending_item.respond",
        "pending_item.attach",
        "pending_item.validate",
        "pending_item.reopen",
      ],
      example: "request.status_change",
    },
    actor: { $ref: "#/components/schemas/AuditActor" },
    previous_value: { type: "string", nullable: true, example: "Em triagem" },
    new_value: { type: "string", nullable: true, example: "Pendente de informações" },
    note: { type: "string", nullable: true, example: "Aguardando documento complementar" },
    last_technical_message: { type: "string", nullable: true, example: null },
    ip_address: { type: "string", nullable: true, example: "127.0.0.1" },
    change_origin: {
      type: "string",
      nullable: true,
      enum: ["admin", "internal", "system", "requester"],
      example: "admin",
    },
    occurred_at: {
      type: "string",
      format: "date-time",
      example: "2026-11-20T14:22:45.736Z",
    },
  },
};

export const StatusTimeInterval = {
  type: "object",
  required: [
    "status",
    "enteredAt",
    "exitedAt",
    "activeMilliseconds",
    "pausedMilliseconds",
    "isPaused",
  ],
  properties: {
    status: { type: "string", example: "Pendente de informações" },
    enteredAt: {
      type: "string",
      format: "date-time",
      example: "2026-11-20T11:00:00.000Z",
    },
    exitedAt: {
      type: "string",
      format: "date-time",
      nullable: true,
      example: null,
    },
    activeMilliseconds: { type: "integer", minimum: 0, example: 0 },
    pausedMilliseconds: { type: "integer", minimum: 0, example: 10800000 },
    isPaused: { type: "boolean", example: true },
  },
};

export const StatusTimeByStatus = {
  type: "object",
  required: ["status", "activeMilliseconds", "pausedMilliseconds", "isPaused"],
  properties: {
    status: { type: "string", example: "Pendente de informações" },
    activeMilliseconds: { type: "integer", minimum: 0, example: 0 },
    pausedMilliseconds: { type: "integer", minimum: 0, example: 10800000 },
    isPaused: { type: "boolean", example: true },
  },
};

export const StatusTimeResponse = {
  type: "object",
  required: [
    "protocol",
    "calculatedAt",
    "intervals",
    "totalsByStatus",
    "totalActiveMilliseconds",
    "totalPausedMilliseconds",
  ],
  properties: {
    protocol: { type: "string", example: "MAAT-8K3P-9X2M" },
    calculatedAt: {
      type: "string",
      format: "date-time",
      example: "2026-11-20T14:22:45.736Z",
    },
    intervals: {
      type: "array",
      items: { $ref: "#/components/schemas/StatusTimeInterval" },
    },
    totalsByStatus: {
      type: "array",
      items: { $ref: "#/components/schemas/StatusTimeByStatus" },
    },
    totalActiveMilliseconds: { type: "integer", minimum: 0, example: 3600000 },
    totalPausedMilliseconds: { type: "integer", minimum: 0, example: 10800000 },
  },
};
