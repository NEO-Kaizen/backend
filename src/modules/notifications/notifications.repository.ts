import db from "../../database/conection.ts";
import { AppError } from "../../shared/errors/AppError.ts";

export interface NotificationRow {
  notification_id: string;
  event_type: string;
  payload: unknown;
  read_at: Date | string | null;
  created_at: Date | string;
}

export interface NotificationCursor {
  notificationId: string;
}

const NOTIFICATION_COLUMNS = [
  "notification_id",
  "event_type",
  "payload",
  "read_at",
  "created_at",
] as const;

export async function listByRecipient(
  recipientUserId: number,
  cursor: NotificationCursor | null,
  limit: number,
): Promise<NotificationRow[]> {
  let query = db("notifications")
    .where("recipient_user_id", recipientUserId)
    .select(NOTIFICATION_COLUMNS)
    .orderBy([
      { column: "created_at", order: "desc" },
      { column: "notification_id", order: "desc" },
    ])
    // Busca um item a mais para saber se existe próxima página.
    .limit(limit + 1);

  if (cursor) {
    // A âncora é relida do banco: `created_at` é TIMESTAMPTZ com precisão de
    // microssegundos, enquanto o cursor carrega o Date (milissegundos). Usar o
    // valor exato evita pular a Notificação seguinte quando várias dividem o
    // mesmo instante (ex.: vários destinatários na mesma transação).
    const anchor = (await db("notifications")
      .where({ notification_id: cursor.notificationId, recipient_user_id: recipientUserId })
      .first("created_at")) as { created_at: Date | string } | undefined;

    if (!anchor) {
      throw new AppError("Cursor inválido.", 400);
    }

    query = query.whereRaw("(created_at, notification_id) < (?, ?)", [
      anchor.created_at,
      cursor.notificationId,
    ]);
  }

  return (await query) as NotificationRow[];
}

export async function findByIdsForRecipient(
  recipientUserId: number,
  notificationIds: readonly string[],
): Promise<NotificationRow[]> {
  if (notificationIds.length === 0) return [];

  return (await db("notifications")
    .where("recipient_user_id", recipientUserId)
    .whereIn("notification_id", notificationIds)
    .select(NOTIFICATION_COLUMNS)
    .orderBy([
      { column: "created_at", order: "asc" },
      { column: "notification_id", order: "asc" },
    ])) as NotificationRow[];
}

/**
 * Notificações criadas depois da âncora (`Last-Event-ID`) para o destinatário.
 * A âncora precisa pertencer ao destinatário; caso contrário, nada é
 * reenviado — a consulta não revela Notificação de terceiros.
 */
export async function findAfterIdForRecipient(
  recipientUserId: number,
  notificationId: string,
): Promise<NotificationRow[]> {
  const anchor = (await db("notifications")
    .where({
      notification_id: notificationId,
      recipient_user_id: recipientUserId,
    })
    .first("created_at")) as { created_at: Date | string } | undefined;

  if (!anchor) return [];

  return (await db("notifications")
    .where("recipient_user_id", recipientUserId)
    .whereRaw("(created_at, notification_id) > (?, ?)", [anchor.created_at, notificationId])
    .select(NOTIFICATION_COLUMNS)
    .orderBy([
      { column: "created_at", order: "asc" },
      { column: "notification_id", order: "asc" },
    ])) as NotificationRow[];
}

export async function countUnread(recipientUserId: number): Promise<number> {
  const row = (await db("notifications")
    .where("recipient_user_id", recipientUserId)
    .whereNull("read_at")
    .count("* as total")
    .first()) as { total: string | number } | undefined;

  return Number(row?.total ?? 0);
}

export interface MarkReadRow {
  notification_id: string;
  read_at: Date | string;
}

export async function markRead(
  recipientUserId: number,
  notificationId: string,
): Promise<MarkReadRow | null> {
  const updated = (await db("notifications")
    .where({
      notification_id: notificationId,
      recipient_user_id: recipientUserId,
    })
    .whereNull("read_at")
    .update({ read_at: db.fn.now() })
    .returning(["notification_id", "read_at"])) as MarkReadRow[];

  const row = updated[0];
  if (row) return row;

  // Já lida: a marcação é idempotente e devolve o instante original.
  const existing = (await db("notifications")
    .where({
      notification_id: notificationId,
      recipient_user_id: recipientUserId,
    })
    .first("notification_id", "read_at")) as MarkReadRow | undefined;

  return existing ?? null;
}

export async function markAllRead(recipientUserId: number): Promise<number> {
  const updated = (await db("notifications")
    .where("recipient_user_id", recipientUserId)
    .whereNull("read_at")
    .update({ read_at: db.fn.now() })
    .returning("notification_id")) as { notification_id: string }[];

  return updated.length;
}
