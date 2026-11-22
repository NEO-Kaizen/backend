import { PENDING_ITEM_RESPONDED_UNASSIGNED_NOTICE } from "../../src/shared/notifications/notificationEvents.ts";

/** Requests fictícias dos cenários com e sem Responsável. */
const SEED_REQUEST_IDS = [1, 3];

/** Administradores ativos do seed 004 — destinatários do cenário sem Responsável. */
const UNASSIGNED_ADMIN_EMAILS = [
  "administrador_teste@email.com",
  "carina.admin@email.com",
  "ines.admin@email.com",
];

/** Data/hora dos Agendamentos fictícios do seed 012 (request 1). */
const MAPPING_SCHEDULED_AT = ["2026-08-15T14:00:00Z", "2026-09-15T14:00:00Z"];

/** Solicitante e designado do Mapeamento concluído no seed 012. */
const MAPPING_RECIPIENT_IDS = [112, 108];

async function findRequestPointers(knex) {
  const rows = await knex("requests")
    .whereIn("request_id", SEED_REQUEST_IDS)
    .join("categories", "categories.category_id", "requests.category_id")
    .select(
      "requests.request_id",
      "requests.protocol",
      "requests.title",
      "categories.name as category",
    );

  const byId = new Map(
    rows.map((row) => [
      Number(row.request_id),
      { protocol: row.protocol, title: row.title, category: row.category },
    ]),
  );

  return new Map(
    SEED_REQUEST_IDS.map((requestId) => {
      const pointer = byId.get(requestId);
      if (!pointer) {
        throw new Error(`Solicitação ${requestId} não encontrada. Rode o seed 006 antes.`);
      }
      return [requestId, pointer];
    }),
  );
}

async function findUnassignedAdminIds(knex) {
  const rows = await knex("users as u")
    .join("profiles as p", "p.profile_id", "u.profile_id")
    .whereIn("u.email", UNASSIGNED_ADMIN_EMAILS)
    .andWhere("u.is_active", true)
    .andWhere("p.name", "administrador")
    .andWhere("p.is_active", true)
    .select("u.user_id")
    .orderBy("u.user_id", "asc");

  if (rows.length !== UNASSIGNED_ADMIN_EMAILS.length) {
    throw new Error("Administradores ativos do seed 004 não encontrados. Rode o seed 004 antes.");
  }

  return rows.map((row) => Number(row.user_id));
}

function notification({
  id,
  recipientUserId,
  requestId,
  payload,
  dedupKey,
  readAt = null,
  createdAt,
}) {
  return {
    notification_id: id,
    recipient_user_id: recipientUserId,
    event_type: payload.type,
    request_id: requestId,
    payload,
    dedup_key: dedupKey,
    read_at: readAt,
    created_at: createdAt,
  };
}

/** Id fixo com sufixo hexadecimal — evita colisão com os ids dos Eventos anteriores. */
function notificationId(offset) {
  return `f0000000-0000-4000-8000-00000000000${offset.toString(16)}`;
}

function buildNotifications({ requestPointers, unassignedAdminIds }) {
  const pointer = (requestId) => {
    const value = requestPointers.get(requestId);
    if (!value) throw new Error(`Ponteiro da solicitação ${requestId} ausente.`);
    return { protocol: value.protocol, title: value.title };
  };

  const mappingOffset = 5 + unassignedAdminIds.length;
  const mappingNotifications = MAPPING_SCHEDULED_AT.flatMap((scheduledAt, conclusionIndex) =>
    MAPPING_RECIPIENT_IDS.map((recipientUserId, recipientIndex) =>
      notification({
        id: notificationId(
          mappingOffset + conclusionIndex * MAPPING_RECIPIENT_IDS.length + recipientIndex,
        ),
        recipientUserId,
        requestId: 1,
        payload: {
          type: "mapping_scheduled",
          ...pointer(1),
          scheduledAt,
        },
        dedupKey: `seed:mapping.complete:${conclusionIndex + 1}:${recipientUserId}`,
        readAt: conclusionIndex === 0 && recipientUserId === 112 ? "2026-08-16 09:00:00" : null,
        createdAt: conclusionIndex === 0 ? "2026-08-15 14:05:00" : "2026-09-10 11:20:00",
      }),
    ),
  );

  return [
    notification({
      id: notificationId(1),
      recipientUserId: 112, // Fabio Solicitante
      requestId: 1,
      payload: {
        type: "status_changed",
        ...pointer(1),
        newStatus: "Aguardando mapeamento",
      },
      dedupKey: "seed:request.status_change:1:112",
      createdAt: "2026-11-18 09:15:00",
    }),
    notification({
      id: notificationId(2),
      recipientUserId: 112, // Fabio Solicitante
      requestId: 1,
      payload: {
        type: "status_changed",
        ...pointer(1),
        newStatus: "Em triagem",
      },
      dedupKey: "seed:request.status_change:2:112",
      readAt: "2026-11-17 14:30:00",
      createdAt: "2026-11-17 14:00:00",
    }),
    notification({
      id: notificationId(3),
      recipientUserId: 104, // Solicitante Teste
      requestId: 3,
      payload: {
        type: "status_changed",
        ...pointer(3),
        newStatus: "Pendente de informações",
      },
      dedupKey: "seed:request.status_change:3:104",
      createdAt: "2026-11-19 10:00:00",
    }),
    notification({
      id: notificationId(4),
      recipientUserId: 101, // Analista Teste — Responsável pela request 1
      requestId: 1,
      payload: {
        type: "pending_item_responded",
        ...pointer(1),
      },
      dedupKey: "seed:request.pending_responded:1:101",
      createdAt: "2026-11-19 16:40:00",
    }),
    ...unassignedAdminIds.map((recipientUserId, index) =>
      notification({
        id: notificationId(5 + index),
        recipientUserId,
        requestId: 3,
        payload: {
          type: "pending_item_responded_unassigned",
          ...pointer(3),
          notice: PENDING_ITEM_RESPONDED_UNASSIGNED_NOTICE,
        },
        dedupKey: `seed:request.pending_responded:3:${recipientUserId}`,
        createdAt: "2026-11-19 16:42:00",
      }),
    ),
    // issue #161: Designação de Responsável (request 1) — designação do Analista
    // Teste e redesignação da Roberta Analista. Idempotente por ids/chaves fixas.
    notification({
      id: notificationId(12),
      recipientUserId: 101, // Analista Teste — primeira designação
      requestId: 1,
      payload: {
        type: "responsible_assigned",
        ...pointer(1),
        category: requestPointers.get(1).category,
        status: "Aguardando mapeamento",
      },
      dedupKey: "seed:request.assigned:1:101",
      createdAt: "2026-11-19 17:00:00",
    }),
    notification({
      id: notificationId(13),
      recipientUserId: 107, // Roberta Analista — redesignação
      requestId: 1,
      payload: {
        type: "responsible_assigned",
        ...pointer(1),
        category: requestPointers.get(1).category,
        status: "Aguardando mapeamento",
      },
      dedupKey: "seed:request.assigned:1:107",
      createdAt: "2026-11-19 17:05:00",
    }),
    ...mappingNotifications,
  ];
}

/**
 * Massa fictícia dos Eventos de Notificação do RF20.
 *
 * - issue #157: `status_changed` para os solicitantes dos seeds 004 e 006;
 * - issue #159: `pending_item_responded` na request 1 (com Responsável) e
 *   `pending_item_responded_unassigned` na request 3 (sem Responsável), com o
 *   aviso explícito e os Administradores ativos do seed 004 como destinatários;
 * - issue #160: `mapping_scheduled` na request 1, cobrindo agendamento e
 *   reagendamento para o solicitante e o designado do Mapeamento do seed 012.
 *
 * Os ids dos Administradores e os ponteiros das solicitações vêm do banco para
 * não duplicar números/strings mágicas do seed 004/006.
 *
 * Pré-requisitos: seeds 004_users e 006_requests (as FKs de destinatário e
 * solicitação precisam existir). Idempotente por `dedup_key`: apaga as
 * Notificações pelos ids fixos e pelas chaves que ele mesmo cria, sem tocar nas
 * Notificações geradas pela API; o prefixo `seed:` evita colisão com as
 * `eventKey` reais. O `TRUNCATE requests CASCADE` do seed 001 já remove as
 * demais por causa da FK.
 */
export async function seed(knex) {
  const [requestPointers, unassignedAdminIds] = await Promise.all([
    findRequestPointers(knex),
    findUnassignedAdminIds(knex),
  ]);
  const notifications = buildNotifications({ requestPointers, unassignedAdminIds });
  const notificationIds = notifications.map((item) => item.notification_id);
  const dedupKeys = notifications.map((item) => item.dedup_key);

  await knex("notifications").whereIn("notification_id", notificationIds).del();
  await knex("notifications").whereIn("dedup_key", dedupKeys).del();
  await knex("notifications").insert(notifications);
}
