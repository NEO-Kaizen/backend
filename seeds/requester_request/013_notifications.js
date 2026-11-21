const NOTIFICATIONS = [
  {
    notification_id: "f0000000-0000-4000-8000-000000000001",
    recipient_user_id: 112, // Fabio Solicitante
    event_type: "status_changed",
    request_id: 1,
    payload: {
      type: "status_changed",
      protocol: "MAAT-8K3P-9X2M",
      title: "Automatizar conciliação bancária",
      newStatus: "Aguardando mapeamento",
    },
    dedup_key: "seed:request.status_change:1:112",
    read_at: null,
    created_at: "2026-11-18 09:15:00",
  },
  {
    notification_id: "f0000000-0000-4000-8000-000000000002",
    recipient_user_id: 112, // Fabio Solicitante
    event_type: "status_changed",
    request_id: 1,
    payload: {
      type: "status_changed",
      protocol: "MAAT-8K3P-9X2M",
      title: "Automatizar conciliação bancária",
      newStatus: "Em triagem",
    },
    dedup_key: "seed:request.status_change:2:112",
    read_at: "2026-11-17 14:30:00",
    created_at: "2026-11-17 14:00:00",
  },
  {
    notification_id: "f0000000-0000-4000-8000-000000000003",
    recipient_user_id: 104, // Solicitante Teste
    event_type: "status_changed",
    request_id: 3,
    payload: {
      type: "status_changed",
      protocol: "MAAT-2R7Q-4M1C",
      title: "Analisar inadimplência por região",
      newStatus: "Pendente de informações",
    },
    dedup_key: "seed:request.status_change:3:104",
    read_at: null,
    created_at: "2026-11-19 10:00:00",
  },
  {
    notification_id: "f0000000-0000-4000-8000-000000000004",
    recipient_user_id: 104, // Solicitante Teste
    event_type: "pending_item_created",
    request_id: 3,
    payload: {
      type: "pending_item_created",
      protocol: "MAAT-2R7Q-4M1C",
      title: "Analisar inadimplência por região",
    },
    dedup_key: "seed:pending_item.create:3:104",
    read_at: null,
    created_at: "2026-11-19 10:05:00",
  },
  {
    notification_id: "f0000000-0000-4000-8000-000000000005",
    recipient_user_id: 104, // Solicitante Teste
    event_type: "pending_item_reopened",
    request_id: 3,
    payload: {
      type: "pending_item_reopened",
      protocol: "MAAT-2R7Q-4M1C",
      title: "Analisar inadimplência por região",
    },
    dedup_key: "seed:pending_item.reopen:3:104",
    read_at: null,
    created_at: "2026-11-19 11:20:00",
  },
  {
    notification_id: "f0000000-0000-4000-8000-000000000006",
    recipient_user_id: 104, // Solicitante Teste
    event_type: "pending_item_validated",
    request_id: 3,
    payload: {
      type: "pending_item_validated",
      protocol: "MAAT-2R7Q-4M1C",
      title: "Analisar inadimplência por região",
    },
    dedup_key: "seed:pending_item.validate:3:104",
    read_at: null,
    created_at: "2026-11-20 09:40:00",
  },
];

/**
 * Massa fictícia dos Eventos de status e do ciclo de Pendência (RF20 —
 * issues #157 e #158).
 *
 * A massa é histórica: os Eventos de Pendência não replicam o estado atual de
 * `pending_items` (um lote aberto pode conviver com Notificações antigas de
 * criação, reabertura e validação).
 *
 * Pré-requisitos: seeds 004_users e 006_requests (as FKs de destinatário e
 * solicitação precisam existir). Idempotente: apaga apenas as Notificações com
 * os ids fixos deste seed e as recria; o `TRUNCATE requests CASCADE` do seed
 * 001 já remove as demais por causa da FK.
 */
export async function seed(knex) {
  const notificationIds = NOTIFICATIONS.map((notification) => notification.notification_id);

  await knex("notifications").whereIn("notification_id", notificationIds).del();
  await knex("notifications").insert(NOTIFICATIONS);
}
