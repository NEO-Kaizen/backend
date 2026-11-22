import { PENDING_ITEM_RESPONDED_UNASSIGNED_NOTICE } from "../../src/shared/notifications/notificationEvents.ts";
import { STATUS_IDS } from "../../src/shared/types/status.ts";

/** Requests fictícias dos cenários com e sem Responsável. */
const SEED_REQUEST_IDS = [1, 3];

/** Administradores ativos do seed 004 — destinatários do cenário sem Responsável. */
const UNASSIGNED_ADMIN_EMAILS = [
  "administrador_teste@email.com",
  "carina.admin@email.com",
  "ines.admin@email.com",
];

/** Request do cenário de Agendamento do Mapeamento — audiência do seed 012. */
const MAPPING_SCHEDULING_REQUEST_ID = 1;

/**
 * Offset dos ids dos Eventos de Agendamento — acima dos ids fixos já ocupados
 * pelo restante do seed (1–10), pelos Administradores (5–7) e pela Designação
 * de Responsável (12–13), para evitar colisão.
 */
const MAPPING_NOTIFICATIONS_OFFSET = 20;

/** Minutos após a conclusão — cronologia: conclusão antes da Notificação. */
const MINUTES_AFTER_CONCLUSION = 10;

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

/**
 * Designado de custódia da solicitação — `requests.mapping_professional_id`
 * resolvido para `users.user_id`; é a audiência declarada na matriz #156.
 */
async function findMappingDesigneeUserId(knex, requestId) {
  const row = await knex("requests as r")
    .join("details_professional as dp", "dp.professional_id", "r.mapping_professional_id")
    .join("users as u", "u.user_id", "dp.user_id")
    .where("r.request_id", requestId)
    .select("u.user_id")
    .first();

  if (!row) {
    throw new Error(
      `Designado de custódia da request ${requestId} ausente` +
        " (`requests.mapping_professional_id` sem usuário vinculado).",
    );
  }

  return Number(row.user_id);
}

/** ISO-8601 UTC com sufixo `Z` e precisão de segundos — igual à Service. */
function toIsoSeconds(value) {
  return new Date(value).toISOString().replace(/\.\d+Z$/, "Z");
}

/** `iso` somado a minutos — mantém a cronologia: conclusão antes da Notificação. */
function minutesAfter(iso, minutes) {
  const date = new Date(iso);
  return new Date(date.getTime() + minutes * 60_000).toISOString().replace(/\.\d+Z$/, "Z");
}

/**
 * Conclusões do Mapeamento para o Status `Mapeamento agendado` no seed 012 —
 * uma Notificação por conclusão, com o `scheduledAt` do Agendamento.
 */
async function findMappingScheduledConclusions(knex, requestId) {
  const rows = await knex("mappings")
    .where({
      request_id: requestId,
      target_status_id: STATUS_IDS.mappingScheduled,
      is_concluded: true,
    })
    .orderBy("concluded_at", "asc")
    .select("mapping_id", "scheduled_for", "concluded_at");

  if (rows.length === 0) {
    throw new Error("Nenhum Mapeamento concluído para 'Mapeamento agendado' no seed 012.");
  }

  return rows.map((row) => ({
    mappingId: row.mapping_id,
    scheduledAt: toIsoSeconds(row.scheduled_for),
    concludedAt: toIsoSeconds(row.concluded_at),
  }));
}

function pointer(requestPointers, requestId) {
  const value = requestPointers.get(requestId);
  if (!value) throw new Error(`Ponteiro da solicitação ${requestId} ausente.`);
  return { protocol: value.protocol, title: value.title };
}

async function findMappingScheduledNotifications(knex, requestPointers, requestId) {
  const [designeeUserId, conclusions] = await Promise.all([
    findMappingDesigneeUserId(knex, requestId),
    findMappingScheduledConclusions(knex, requestId),
  ]);

  return conclusions.map((conclusion, index) =>
    notification({
      id: seedNotificationId(MAPPING_NOTIFICATIONS_OFFSET + index),
      recipientUserId: designeeUserId,
      requestId,
      payload: {
        type: "mapping_scheduled",
        ...pointer(requestPointers, requestId),
        scheduledAt: conclusion.scheduledAt,
      },
      dedupKey: `seed:mapping.complete:${conclusion.mappingId}`,
      createdAt: minutesAfter(conclusion.concludedAt, MINUTES_AFTER_CONCLUSION),
    }),
  );
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

function seedNotificationId(value) {
  return `f0000000-0000-4000-8000-${String(value).padStart(12, "0")}`;
}

function buildNotifications({
  requestPointers,
  unassignedAdminIds,
  mappingScheduledNotifications,
}) {
  const pointerAt = (requestId) => pointer(requestPointers, requestId);

  return [
    notification({
      id: seedNotificationId(1),
      recipientUserId: 112, // Fabio Solicitante
      requestId: 1,
      payload: {
        type: "status_changed",
        ...pointerAt(1),
        newStatus: "Aguardando mapeamento",
      },
      dedupKey: "seed:request.status_change:1:112",
      createdAt: "2026-11-18 09:15:00",
    }),
    notification({
      id: seedNotificationId(2),
      recipientUserId: 112, // Fabio Solicitante
      requestId: 1,
      payload: {
        type: "status_changed",
        ...pointerAt(1),
        newStatus: "Em triagem",
      },
      dedupKey: "seed:request.status_change:2:112",
      readAt: "2026-11-17 14:30:00",
      createdAt: "2026-11-17 14:00:00",
    }),
    notification({
      id: seedNotificationId(3),
      recipientUserId: 104, // Solicitante Teste
      requestId: 3,
      payload: {
        type: "status_changed",
        ...pointerAt(3),
        newStatus: "Pendente de informações",
      },
      dedupKey: "seed:request.status_change:3:104",
      createdAt: "2026-11-19 10:00:00",
    }),
    notification({
      id: seedNotificationId(4),
      recipientUserId: 101, // Analista Teste — Responsável pela request 1
      requestId: 1,
      payload: {
        type: "pending_item_responded",
        ...pointerAt(1),
      },
      dedupKey: "seed:request.pending_responded:1:101",
      createdAt: "2026-11-19 16:40:00",
    }),
    ...unassignedAdminIds.map((recipientUserId, index) =>
      notification({
        id: seedNotificationId(5 + index),
        recipientUserId,
        requestId: 3,
        payload: {
          type: "pending_item_responded_unassigned",
          ...pointerAt(3),
          notice: PENDING_ITEM_RESPONDED_UNASSIGNED_NOTICE,
        },
        dedupKey: `seed:request.pending_responded:3:${recipientUserId}`,
        createdAt: "2026-11-19 16:42:00",
      }),
    ),
    notification({
      id: seedNotificationId(8),
      recipientUserId: 104, // Solicitante Teste
      requestId: 3,
      payload: {
        type: "pending_item_created",
        ...pointerAt(3),
      },
      dedupKey: "seed:pending_item.create:3:104",
      createdAt: "2026-11-19 10:05:00",
    }),
    notification({
      id: seedNotificationId(9),
      recipientUserId: 104, // Solicitante Teste
      requestId: 3,
      payload: {
        type: "pending_item_reopened",
        ...pointerAt(3),
      },
      dedupKey: "seed:pending_item.reopen:3:104",
      createdAt: "2026-11-19 11:20:00",
    }),
    notification({
      id: seedNotificationId(10),
      recipientUserId: 104, // Solicitante Teste
      requestId: 3,
      payload: {
        type: "pending_item_validated",
        ...pointerAt(3),
      },
      dedupKey: "seed:pending_item.validate:3:104",
      createdAt: "2026-11-20 09:40:00",
    }),
    ...mappingScheduledNotifications,
  ];
}

/**
 * Massa fictícia dos Eventos de Notificação do RF20.
 *
 * - issue #157: `status_changed` para os solicitantes dos seeds 004 e 006;
 * - issue #158: `pending_item_created`, `pending_item_reopened` e
 *   `pending_item_validated` para o solicitante da request 3;
 * - issue #159: `pending_item_responded` na request 1 (com Responsável) e
 *   `pending_item_responded_unassigned` na request 3 (sem Responsável), com o
 *   aviso explícito e os Administradores ativos do seed 004 como destinatários; * - issue #160: `mapping_scheduled` para a request 1 — agendamento e
 *   reagendamento do Mapeamento do seed 012, com destinatário resolvido do
 *   designado de custódia da request (`requests.mapping_professional_id`).
 *
 * Os ids dos Administradores e os ponteiros das solicitações vêm do banco para
 * não duplicar números/strings mágicas do seed 004/006. O Agendamento do
 * Mapeamento deriva também do banco: uma Notificação por conclusão
 * (`mappings` com `target_status_id` 6), com o `scheduledAt` do Agendamento.
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
    MAPPING_SCHEDULING_REQUEST_ID,
  );

  const notifications = buildNotifications({
    requestPointers,
    unassignedAdminIds,
    mappingScheduledNotifications,
  });
  const notificationIds = notifications.map((item) => item.notification_id);
  const dedupKeys = notifications.map((item) => item.dedup_key);

  // Limpa as Notificações de Agendamento antigas da request — o espaço de ids
  // muda ao deste seed — sem tocar nas de outros Eventos nem do designado.
  await knex("notifications")
    .where({ request_id: MAPPING_SCHEDULING_REQUEST_ID, event_type: "mapping_scheduled" })
    .del();

  await knex("notifications").whereIn("notification_id", notificationIds).del();
  await knex("notifications").whereIn("dedup_key", dedupKeys).del();
  await knex("notifications").insert(notifications);
}
