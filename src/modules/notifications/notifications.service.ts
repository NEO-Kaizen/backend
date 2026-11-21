import { AppError } from "../../shared/errors/AppError.ts";
import { notificationPayloadSchema } from "../../shared/notifications/notificationEvents.ts";
import { normalizeIsoDate } from "../../shared/utils/date.ts";
import type {
  NotificationItem,
  NotificationListResponse,
  NotificationMarkAllReadResponse,
  NotificationMarkReadResponse,
  NotificationUnreadCountResponse,
} from "../DTOs/notifications/Notifications.dto.ts";
import * as repository from "./notifications.repository.ts";
import type { NotificationCursor, NotificationRow } from "./notifications.repository.ts";
import type { ListNotificationsQuery, NotificationCursorPayload } from "./notifications.schema.ts";

const CURSOR_SEPARATOR = "|";

function toNotificationItem(row: NotificationRow): NotificationItem {
  const payload = notificationPayloadSchema.safeParse(row.payload);
  const createdAt = normalizeIsoDate(row.created_at);

  if (!payload.success || !createdAt) {
    // Payload fora da Allowlist é corrupção de dados, não entrada do usuário.
    throw new AppError("Não foi possível carregar as notificações.", 500);
  }

  return {
    id: row.notification_id,
    type: payload.data.type,
    payload: payload.data,
    readAt: normalizeIsoDate(row.read_at),
    createdAt,
  };
}

function encodeCursor(item: NotificationItem): string {
  return Buffer.from(`${item.createdAt}${CURSOR_SEPARATOR}${item.id}`, "utf8").toString(
    "base64url",
  );
}

function toRepositoryCursor(
  cursor: NotificationCursorPayload | undefined,
): NotificationCursor | null {
  if (cursor === undefined) return null;

  return { notificationId: cursor.id };
}

export async function listNotifications(
  recipientUserId: number,
  query: ListNotificationsQuery,
): Promise<NotificationListResponse> {
  const rows = await repository.listByRecipient(
    recipientUserId,
    toRepositoryCursor(query.cursor),
    query.limit,
  );

  const hasNextPage = rows.length > query.limit;
  const pageRows = hasNextPage ? rows.slice(0, query.limit) : rows;
  const items = pageRows.map(toNotificationItem);
  const lastItem = items.at(-1);

  return {
    items,
    nextCursor: hasNextPage && lastItem ? encodeCursor(lastItem) : null,
  };
}

export async function getUnreadCount(
  recipientUserId: number,
): Promise<NotificationUnreadCountResponse> {
  return { unreadCount: await repository.countUnread(recipientUserId) };
}

export async function markNotificationRead(
  recipientUserId: number,
  notificationId: string,
): Promise<NotificationMarkReadResponse> {
  const row = await repository.markRead(recipientUserId, notificationId);

  if (!row) {
    throw new AppError("Notificação não encontrada", 404);
  }

  const readAt = normalizeIsoDate(row.read_at);
  if (!readAt) {
    throw new AppError("Não foi possível marcar a notificação como lida.", 500);
  }

  return { id: row.notification_id, readAt };
}

export async function markAllNotificationsRead(
  recipientUserId: number,
): Promise<NotificationMarkAllReadResponse> {
  return { markedRead: await repository.markAllRead(recipientUserId) };
}

export async function findNotificationsByIds(
  recipientUserId: number,
  notificationIds: readonly string[],
): Promise<NotificationItem[]> {
  const rows = await repository.findByIdsForRecipient(recipientUserId, notificationIds);
  return rows.map(toNotificationItem);
}

export async function findNotificationsAfter(
  recipientUserId: number,
  notificationId: string,
): Promise<NotificationItem[]> {
  const rows = await repository.findAfterIdForRecipient(recipientUserId, notificationId);
  return rows.map(toNotificationItem);
}
