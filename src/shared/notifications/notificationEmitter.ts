import { EventEmitter } from "node:events";
import type { CommittedNotification } from "./emitNotification.ts";

const NOTIFICATIONS_COMMITTED = "notifications:committed";

export interface NotificationCommittedPayload {
  userId: number;
  notificationIds: string[];
}

/**
 * Aviso pós-commit para os assinantes do SSE. O banco continua sendo a fonte
 * de verdade: o payload carrega apenas o destinatário e os ids gravados.
 */
const emitter = new EventEmitter();
// Uma conexão SSE por aba aberta; não queremos o aviso de max listeners.
emitter.setMaxListeners(0);

export function onNotificationCommitted(
  listener: (payload: NotificationCommittedPayload) => void,
): () => void {
  emitter.on(NOTIFICATIONS_COMMITTED, listener);
  return () => emitter.off(NOTIFICATIONS_COMMITTED, listener);
}

export function publishCommittedNotifications(committed: readonly CommittedNotification[]): void {
  const idsByUser = new Map<number, string[]>();

  for (const notification of committed) {
    const ids = idsByUser.get(notification.recipientUserId);

    if (ids) {
      ids.push(notification.notificationId);
    } else {
      idsByUser.set(notification.recipientUserId, [notification.notificationId]);
    }
  }

  for (const [userId, notificationIds] of idsByUser) {
    const payload: NotificationCommittedPayload = { userId, notificationIds };
    emitter.emit(NOTIFICATIONS_COMMITTED, payload);
  }
}
