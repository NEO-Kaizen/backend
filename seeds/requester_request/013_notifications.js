import { PENDING_ITEM_RESPONDED_UNASSIGNED_NOTICE } from "../../src/shared/notifications/notificationEvents.ts";

/** Requests fictícias dos cenários com e sem Responsável. */
const SEED_REQUEST_IDS = [1, 3];

/** Mapeamentos concluídos para `Mapeamento agendado` no seed 012 (issue #160). */
const SCHEDULED_MAPPING_IDS = [
  "aaaaaaaa-aaaa-4000-8000-000000000020",
  "aaaaaaaa-aaaa-4000-8000-000000000021",
  "aaaaaaaa-aaaa-4000-8000-000000000022",
];
/** Ids livres (1–4 e 12–13 já ocupados; 5–7 dos Administradores). */
const MAPPING_NOTIFICATIONS_FIRST_ID = 20;

const mappingNotificationId = (ordinal) =>
  `f0000000-0000-4000-8000-${String(ordinal).padStart(12, "0")}`;

/** Administradores ativos do seed 004 — destinatários do cenário sem Responsável. */
const UNASSIGNED_ADMIN_EMAILS = [
  "administrador_teste@email.com",
  "carina.admin@email.com",
  "ines.admin@email.com",
];

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

/** Ponteiro (protocolo/título) de uma solicitação do seed. */
function pointerFor(pointers, requestId) {
  const value = pointers.get(requestId);
  if (!value) throw new Error(`Ponteiro da solicitação ${requestId} ausente.`);
  return { protocol: value.protocol, title: value.title };
}

/** Conclusões do seed 012 com seus destinatários (solicitante + Responsável do Mapeamento). */
async function findMappingScheduledNotifications(knex, requestPointers) {
  const mappings = await knex("mappings")
    .whereIn("mapping_id", SCHEDULED_MAPPING_IDS)
    .where({ is_concluded: true, target_status_id: 6 })
    .orderBy("concluded_at", "asc")
    .select("mapping_id", "request_id", "scheduled_for", "concluded_at");
  if (mappings.length === 0) throw new Error("Mapeamentos agendados do seed 012 não encontrados.");

  const request = await knex("requests as r")
    .where("r.request_id", mappings[0].request_id)
    .leftJoin("details_professional as dp", "dp.professional_id", "r.mapping_professional_id")
    .leftJoin("users as u", "u.user_id", "dp.user_id")
    .first("r.requester_user_id", "u.user_id as mapping_user_id");
  if (!request)
    throw new Error("Solicitação do Agendamento não encontrada. Rode o seed 006 antes.");

  const recipients = [request.requester_user_id, request.mapping_user_id].filter(
    (userId) => userId !== null,
  );
  return mappings.flatMap((mapping) =>
    recipients.map((recipientUserId) =>
      notification({
        id: mappingNotificationId(
          MAPPING_NOTIFICATIONS_FIRST_ID +
            mappings.indexOf(mapping) * recipients.length +
            recipients.indexOf(recipientUserId),
        ),
        recipientUserId,
        requestId: Number(mapping.request_id),
        payload: {
          type: "mapping_scheduled",
          ...pointerFor(requestPointers, Number(mapping.request_id)),
          scheduledAt: toIsoSeconds(mapping.scheduled_for),
        },
        dedupKey: `seed:mapping.complete:${mapping.mapping_id}:${recipientUserId}`,
        createdAt: toIsoSeconds(new Date(new Date(mapping.concluded_at).getTime() + 10 * 60_000)),
      }),
    ),
  );
}

function toIsoSeconds(value) {
  return new Date(value).toISOString().replace(/\.\d+Z$/, "Z");
}

function buildNotifications({
  requestPointers,
  unassignedAdminIds,
  mappingScheduledNotifications,
}) {
  const pointer = (requestId) => {
    const value = requestPointers.get(requestId);
    if (!value) throw new Error(`Ponteiro da solicitação ${requestId} ausente.`);
    return { protocol: value.protocol, title: value.title };
  };

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
    ...mappingScheduledNotifications,
  ];
}

/**
 * Massa fictícia dos Eventos de Notificação do RF20.
 *
 * - issue #157: `status_changed` para os solicitantes dos seeds 004 e 006;
 * - issue #159: `pending_item_responded` na request 1 (com Responsável) e
 *   `pending_item_responded_unassigned` na request 3 (sem Responsável), com o
 *   aviso explícito e os Administradores ativos do seed 004 como destinatários;
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
  const mappingScheduledNotifications = await findMappingScheduledNotifications(
    knex,
    requestPointers,
  );
  const notifications = buildNotifications({
    requestPointers,
    unassignedAdminIds,
    mappingScheduledNotifications,
  });
  const notificationIds = notifications.map((item) => item.notification_id);
  const dedupKeys = notifications.map((item) => item.dedup_key);

  await knex("notifications").whereIn("notification_id", notificationIds).del();
  await knex("notifications").whereIn("dedup_key", dedupKeys).del();
  await knex("notifications").insert(notifications);
}
