import {
  NOTIFICATION_EVENT_TYPES,
  PENDING_ITEM_EVENT_TYPES,
  PENDING_ITEM_RESPONDED_UNASSIGNED_NOTICE,
} from "../../shared/notifications/notificationEvents.ts";

export const NotificationStatusChangedPayload = {
  type: "object",
  description:
    "Payload do Evento `status_changed`: tipo, protocolo, título e o novo Status público.",
  required: ["type", "protocol", "title", "newStatus"],
  properties: {
    type: { type: "string", enum: ["status_changed"], example: "status_changed" },
    protocol: { type: "string", example: "MAAT-8K3P-9X2M" },
    title: { type: "string", example: "Automatizar conciliação bancária" },
    newStatus: { type: "string", example: "Aguardando mapeamento" },
  },
};

const pendingItemLifecyclePayload = {
  type: "object",
  description:
    "Payload dos Eventos de criação, reabertura e validação de Pendência: contém apenas tipo, protocolo e título.",
  required: ["type", "protocol", "title"],
  properties: {
    type: {
      type: "string",
      enum: PENDING_ITEM_EVENT_TYPES,
      example: "pending_item_created",
    },
    protocol: { type: "string", example: "MAAT-8K3P-9X2M" },
    title: { type: "string", example: "Automatizar conciliação bancária" },
  },
};

export const NotificationPendingItemRespondedPayload = {
  type: "object",
  description:
    "Payload do Evento de Pendência respondida com Responsável designado. Aponta para a solicitação sem expor dados internos.",
  required: ["type", "protocol", "title"],
  properties: {
    type: {
      type: "string",
      enum: ["pending_item_responded"],
      example: "pending_item_responded",
    },
    protocol: { type: "string", example: "MAAT-8K3P-9X2M" },
    title: { type: "string", example: "Automatizar conciliação bancária" },
  },
};

export const NotificationPendingItemRespondedUnassignedPayload = {
  type: "object",
  description:
    "Payload do Evento de Pendência respondida sem Responsável designado; inclui o aviso explícito para os Administradores ativos.",
  required: ["type", "protocol", "title", "notice"],
  properties: {
    type: {
      type: "string",
      enum: ["pending_item_responded_unassigned"],
      example: "pending_item_responded_unassigned",
    },
    protocol: { type: "string", example: "MAAT-2R7Q-4M1C" },
    title: { type: "string", example: "Analisar inadimplência por região" },
    notice: {
      type: "string",
      enum: [PENDING_ITEM_RESPONDED_UNASSIGNED_NOTICE],
      example: PENDING_ITEM_RESPONDED_UNASSIGNED_NOTICE,
    },
  },
};

export const NotificationMappingScheduledPayload = {
  type: "object",
  description:
    "Payload do Evento `mapping_scheduled`: tipo, protocolo, título e data/hora do Agendamento.",
  required: ["type", "protocol", "title", "scheduledAt"],
  properties: {
    type: { type: "string", enum: ["mapping_scheduled"], example: "mapping_scheduled" },
    protocol: { type: "string", example: "MAAT-8K3P-9X2M" },
    title: { type: "string", example: "Automatizar conciliação bancária" },
    scheduledAt: {
      type: "string",
      format: "date-time",
      description: "Data/hora do Agendamento (ISO-8601 UTC).",
      example: "2026-08-15T14:00:00Z",
    },
  },
};

export const NotificationPayload = {
  oneOf: [
    { $ref: "#/components/schemas/NotificationStatusChangedPayload" },
    { $ref: "#/components/schemas/NotificationMappingScheduledPayload" },
    pendingItemLifecyclePayload,
    { $ref: "#/components/schemas/NotificationPendingItemRespondedPayload" },
    { $ref: "#/components/schemas/NotificationPendingItemRespondedUnassignedPayload" },
  ],
  discriminator: { propertyName: "type" },
  description:
    "Payload reduzido à Allowlist do Evento. Nunca contém mensagem técnica, scores, notas internas ou campos de triagem.",
};

export const NotificationItem = {
  type: "object",
  required: ["id", "type", "payload", "readAt", "createdAt"],
  properties: {
    id: { type: "string", example: "f0000000-0000-4000-8000-000000000001" },
    type: {
      type: "string",
      enum: [...NOTIFICATION_EVENT_TYPES],
      example: "status_changed",
    },
    payload: { $ref: "#/components/schemas/NotificationPayload" },
    readAt: {
      type: "string",
      format: "date-time",
      nullable: true,
      example: null,
    },
    createdAt: {
      type: "string",
      format: "date-time",
      example: "2026-11-18T12:15:00.000Z",
    },
  },
};

export const NotificationListResponse = {
  type: "object",
  required: ["items", "nextCursor"],
  properties: {
    items: {
      type: "array",
      items: { $ref: "#/components/schemas/NotificationItem" },
    },
    nextCursor: {
      type: "string",
      nullable: true,
      description: "Cursor opaco para a próxima página; null na última.",
      example: null,
    },
  },
};

export const NotificationUnreadCountResponse = {
  type: "object",
  required: ["unreadCount"],
  properties: {
    unreadCount: { type: "integer", example: 2 },
  },
};

export const NotificationMarkReadResponse = {
  type: "object",
  required: ["id", "readAt"],
  properties: {
    id: { type: "string", example: "f0000000-0000-4000-8000-000000000001" },
    readAt: {
      type: "string",
      format: "date-time",
      example: "2026-11-18T12:30:00.000Z",
    },
  },
};

export const NotificationMarkAllReadResponse = {
  type: "object",
  required: ["markedRead"],
  properties: {
    markedRead: { type: "integer", example: 2 },
  },
};
