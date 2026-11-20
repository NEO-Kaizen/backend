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
];

/**
 * Massa fictícia do Evento de status (RF20 — issue #157).
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
