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

/**
 * Lê o `created_at` exato da âncora (microssegundos) como texto. O driver
 * converte TIMESTAMPTZ para `Date` em milissegundos; usar esse `Date` no
 * comparativo faria a própria âncora ser reenviada no replay e poderia
 * pular/reordenar itens que dividem o mesmo milissegundo.
 */
async function findAnchorCreatedAt(
  recipientUserId: number,
  notificationId: string,
): Promise<string | undefined> {
  const row = (await db("notifications")
    .where({
      notification_id: notificationId,
      recipient_user_id: recipientUserId,
    })
    .select(db.raw(`to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS.USOF') as created_at`))
    .first()) as { created_at: string } | undefined;

  return row?.created_at;
}

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
    // A âncora é relida do banco como texto com microssegundos; o cursor
    // carrega apenas o id e não pode depender do Date truncado pelo driver.
    const anchorCreatedAt = await findAnchorCreatedAt(recipientUserId, cursor.notificationId);

    if (!anchorCreatedAt) {
      throw new AppError("Cursor inválido.", 400);
    }

    query = query.whereRaw("(created_at, notification_id) < (?::timestamptz, ?::uuid)", [
      anchorCreatedAt,
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
 *
 * O comparativo usa o `created_at` exato (microssegundos) e exclui a própria
 * âncora, então reconectar não reenvia o último evento recebido.
 */
export async function findAfterIdForRecipient(
  recipientUserId: number,
  notificationId: string,
): Promise<NotificationRow[]> {
  const anchorCreatedAt = await findAnchorCreatedAt(recipientUserId, notificationId);

  if (!anchorCreatedAt) return [];

  return (await db("notifications")
    .where("recipient_user_id", recipientUserId)
    .whereNot("notification_id", notificationId)
    .whereRaw("(created_at, notification_id) > (?::timestamptz, ?::uuid)", [
      anchorCreatedAt,
      notificationId,
    ])
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
