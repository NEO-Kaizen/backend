import type { Knex } from "knex";
import type {
  NotificationChannel,
  NotificationDelivery,
  NotificationToDeliver,
} from "./notificationChannel.ts";

interface InsertedNotificationRow {
  notification_id: string;
  recipient_user_id: number;
}

/**
 * Canal in-app: a entrega é a própria gravação da Notificação na transação do
 * evento. `onConflict(...).ignore()` torna a emissão idempotente pela
 * `dedup_key`; a linha já existente não é reenviada.
 */
export const inAppNotificationChannel: NotificationChannel = {
  name: "in_app",

  async deliver(
    trx: Knex.Transaction,
    notification: NotificationToDeliver,
  ): Promise<NotificationDelivery | null> {
    const rows = (await trx("notifications")
      .insert({
        recipient_user_id: notification.recipientUserId,
        event_type: notification.eventType,
        request_id: notification.requestId,
        payload: notification.payload,
        dedup_key: notification.dedupKey,
      })
      .onConflict("dedup_key")
      .ignore()
      .returning(["notification_id", "recipient_user_id"])) as InsertedNotificationRow[];

    const row = rows[0];
    if (!row) return null;

    return {
      notificationId: row.notification_id,
      recipientUserId: Number(row.recipient_user_id),
    };
  },
};
