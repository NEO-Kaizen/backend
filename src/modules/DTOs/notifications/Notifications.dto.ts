import type {
  NotificationEventType,
  NotificationPayload,
} from "../../../shared/notifications/notificationEvents.ts";

/** Item de Notificação exposto na lista e no stream SSE. */
export interface NotificationItem {
  id: string;
  type: NotificationEventType;
  payload: NotificationPayload;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  /** Cursor opaco para a próxima página; `null` na última. */
  nextCursor: string | null;
}

export interface NotificationUnreadCountResponse {
  unreadCount: number;
}

export interface NotificationMarkReadResponse {
  id: string;
  readAt: string;
}

export interface NotificationMarkAllReadResponse {
  markedRead: number;
}
