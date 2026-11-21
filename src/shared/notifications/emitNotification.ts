import type { Knex } from "knex";
import { AppError } from "../errors/AppError.ts";
import { notificationEventSchema, type NotificationEvent } from "./notificationEvents.ts";
import type { NotificationChannel } from "./notificationChannel.ts";
import { inAppNotificationChannel } from "./inAppNotificationChannel.ts";

const channels: readonly NotificationChannel[] = [inAppNotificationChannel];

export interface CommittedNotification {
  notificationId: string;
  recipientUserId: number;
}

/**
 * Seam transacional de emissão, no molde de `recordAudit`.
 *
 * A Notificação é gravada na MESMA transação do evento de negócio: se o
 * evento falhar, nada é gravado; se a emissão falhar, o evento também sofre
 * rollback. O aviso pós-commit é responsabilidade de
 * `publishCommittedNotifications`.
 *
 * Regras transversais da matriz de audiência:
 * - o ator nunca recebe Notificação da própria ação;
 * - cada destinatário recebe no máximo uma Notificação por Evento
 *   (`dedup_key` = evento + destinatário);
 * - o Evento é validado pelo schema antes de qualquer gravação.
 */
export async function emitNotification(
  trx: Knex.Transaction,
  event: NotificationEvent,
): Promise<CommittedNotification[]> {
  const parsed = notificationEventSchema.safeParse(event);

  if (!parsed.success) {
    throw new AppError("Evento de notificação inválido.", 500);
  }

  const data = parsed.data;
  const recipients = [...new Set(data.recipientUserIds)].filter(
    (userId) => userId !== data.actorUserId,
  );

  // Entregas independentes: cada par destinatário/canal grava a própria linha.
  const deliveries = await Promise.all(
    recipients.flatMap((recipientUserId) =>
      channels.map((channel) =>
        channel.deliver(trx, {
          recipientUserId,
          eventType: data.type,
          requestId: data.requestId,
          payload: data.payload,
          dedupKey: `${data.eventKey}:${recipientUserId}`,
        }),
      ),
    ),
  );

  return deliveries.filter((delivery): delivery is CommittedNotification => delivery !== null);
}
