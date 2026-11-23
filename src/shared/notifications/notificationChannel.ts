import type { Knex } from "knex";
import type { NotificationEventType, NotificationPayload } from "./notificationEvents.ts";

export interface NotificationToDeliver {
  recipientUserId: number;
  eventType: NotificationEventType;
  requestId: string;
  payload: NotificationPayload;
  dedupKey: string;
}

export interface NotificationDelivery {
  notificationId: string;
  recipientUserId: number;
}

/**
 * Canal de entrega de Notificação.
 *
 * O canal in-app é o único da v1. O canal de e-mail do RF31 entra como outra
 * implementação desta interface, sem alterar os fluxos de negócio.
 */
export interface NotificationChannel {
  readonly name: string;
  deliver(
    trx: Knex.Transaction,
    notification: NotificationToDeliver,
  ): Promise<NotificationDelivery | null>;
}
