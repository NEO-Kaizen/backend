const statusChangedPayload = {
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

const pendingItemPayload = {
  type: "object",
  description: "Payload dos Eventos do ciclo de Pendência: contém apenas tipo, protocolo e título.",
  required: ["type", "protocol", "title"],
  properties: {
    type: {
      type: "string",
      enum: ["pending_item_created", "pending_item_reopened", "pending_item_validated"],
      example: "pending_item_created",
    },
    protocol: { type: "string", example: "MAAT-8K3P-9X2M" },
    title: { type: "string", example: "Automatizar conciliação bancária" },
  },
};

export const NotificationPayload = {
  description:
    "Payload reduzido à Allowlist do Evento. Nunca contém mensagem técnica, scores, notas internas ou campos de triagem.",
  oneOf: [statusChangedPayload, pendingItemPayload],
};

export const NotificationItem = {
  type: "object",
  required: ["id", "type", "payload", "readAt", "createdAt"],
  properties: {
    id: { type: "string", example: "f0000000-0000-4000-8000-000000000001" },
    type: {
      type: "string",
      enum: [
        "status_changed",
        "pending_item_created",
        "pending_item_reopened",
        "pending_item_validated",
      ],
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
