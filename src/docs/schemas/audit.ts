import { auditCatalog } from "../../shared/audit/auditCatalog.ts";

const auditEntityTypes = Object.keys(auditCatalog);
const auditActionTypes = Object.entries(auditCatalog).flatMap(([entity, definition]) =>
  definition.actions.map((action) => `${entity}.${action}`),
);

export const AuditActor = {
  type: "object",
  required: ["kind", "userId", "displayName"],
  properties: {
    kind: { type: "string", enum: ["system", "user"], example: "user" },
    userId: { type: "integer", nullable: true, example: 102 },
    displayName: { type: "string", nullable: true, example: "Administrador Teste" },
  },
};

export const AuditHistorySummary = {
  type: "object",
  required: ["audit_id", "entity_type", "entity_type_label", "action_type", "actor", "occurred_at"],
  properties: {
    audit_id: { type: "integer", minimum: 1, example: 17 },
    entity_type: { type: "string", enum: auditEntityTypes, example: "request" },
    entity_type_label: { type: "string", example: "Solicitações" },
    action_type: { type: "string", enum: auditActionTypes, example: "request.status_change" },
    actor: { $ref: "#/components/schemas/AuditActor" },
    occurred_at: {
      type: "string",
      format: "date-time",
      example: "2026-11-20T14:22:45.736Z",
    },
  },
};

export const AuditHistoryListResponse = {
  type: "object",
  required: ["items", "total", "page", "limit"],
  properties: {
    items: {
      type: "array",
      items: { $ref: "#/components/schemas/AuditHistorySummary" },
    },
    total: { type: "integer", minimum: 0, example: 42 },
    page: { type: "integer", minimum: 1, example: 1 },
    limit: { type: "integer", minimum: 1, maximum: 100, example: 20 },
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
      enum: auditEntityTypes,
      example: "request",
    },
    entity_id: { type: "string", example: "MAAT-8K3P-9X2M" },
    action_type: {
      type: "string",
      enum: auditActionTypes,
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
      description:
        "Instante de saída; null somente para o Status atual não terminal. Em Status terminal, coincide com enteredAt.",
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
