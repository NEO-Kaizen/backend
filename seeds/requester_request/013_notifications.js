import { PENDING_ITEM_RESPONDED_UNASSIGNED_NOTICE } from "../../src/shared/notifications/notificationEvents.ts";

const REQUEST_POINTERS = {
  1: { protocol: "MAAT-8K3P-9X2M", title: "Automatizar conciliação bancária" },
  3: { protocol: "MAAT-2R7Q-4M1C", title: "Analisar inadimplência por região" },
};

const UNASSIGNED_ADMIN_IDS = [
  102, // Administrador Teste
  109, // Carina Admin
  115, // Ines Admin
];

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

const NOTIFICATIONS = [
  notification({
    id: "f0000000-0000-4000-8000-000000000001",
    recipientUserId: 112, // Fabio Solicitante
    requestId: 1,
    payload: {
      type: "status_changed",
      ...REQUEST_POINTERS[1],
      newStatus: "Aguardando mapeamento",
    },
    dedupKey: "seed:request.status_change:1:112",
    createdAt: "2026-11-18 09:15:00",
  }),
  notification({
    id: "f0000000-0000-4000-8000-000000000002",
    recipientUserId: 112, // Fabio Solicitante
    requestId: 1,
    payload: {
      type: "status_changed",
      ...REQUEST_POINTERS[1],
      newStatus: "Em triagem",
    },
    dedupKey: "seed:request.status_change:2:112",
    readAt: "2026-11-17 14:30:00",
    createdAt: "2026-11-17 14:00:00",
  }),
  notification({
    id: "f0000000-0000-4000-8000-000000000003",
    recipientUserId: 104, // Solicitante Teste
    requestId: 3,
    payload: {
      type: "status_changed",
      ...REQUEST_POINTERS[3],
      newStatus: "Pendente de informações",
    },
    dedupKey: "seed:request.status_change:3:104",
    createdAt: "2026-11-19 10:00:00",
  }),
  notification({
    id: "f0000000-0000-4000-8000-000000000004",
    recipientUserId: 101, // Analista Teste — Responsável pela request 1
    requestId: 1,
    payload: {
      type: "pending_item_responded",
      ...REQUEST_POINTERS[1],
    },
    dedupKey: "seed:request.pending_responded:1:101",
    createdAt: "2026-11-19 16:40:00",
  }),
  ...UNASSIGNED_ADMIN_IDS.map((recipientUserId, index) =>
    notification({
      id: `f0000000-0000-4000-8000-00000000000${5 + index}`,
      recipientUserId,
      requestId: 3,
      payload: {
        type: "pending_item_responded_unassigned",
        ...REQUEST_POINTERS[3],
        notice: PENDING_ITEM_RESPONDED_UNASSIGNED_NOTICE,
      },
      dedupKey: `seed:request.pending_responded:3:${recipientUserId}`,
      createdAt: "2026-11-19 16:42:00",
    }),
  ),
];

/**
 * Massa fictícia dos Eventos de Notificação do RF20.
 *
 * - issue #157: `status_changed` para os solicitantes dos seeds 004 e 006;
 * - issue #159: `pending_item_responded` na request 1 (com Responsável) e
 *   `pending_item_responded_unassigned` na request 3 (sem Responsável), com o
 *   aviso explícito e os Administradores ativos do seed 004 como destinatários.
 *
 * Pré-requisitos: seeds 004_users e 006_requests (as FKs de destinatário e
 * solicitação precisam existir). Idempotente por `dedup_key`: apaga as
 * Notificações pelos ids fixos e pelas chaves que ele mesmo cria, sem tocar nas
 * Notificações geradas pela API; o `TRUNCATE requests CASCADE` do seed 001 já
 * remove as demais por causa da FK.
 */
export async function seed(knex) {
  const notificationIds = NOTIFICATIONS.map((notification) => notification.notification_id);
  const dedupKeys = NOTIFICATIONS.map((notification) => notification.dedup_key);

  await knex("notifications").whereIn("notification_id", notificationIds).del();
  await knex("notifications").whereIn("dedup_key", dedupKeys).del();
  await knex("notifications").insert(NOTIFICATIONS);
}
