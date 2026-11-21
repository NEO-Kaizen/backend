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
    recipient_user_id: 101, // Analista Teste — Responsável pela request 1
    event_type: "pending_item_responded",
    request_id: 1,
    payload: {
      type: "pending_item_responded",
      protocol: "MAAT-8K3P-9X2M",
      title: "Automatizar conciliação bancária",
    },
    dedup_key: "seed:request.pending_responded:1:101",
    read_at: null,
    created_at: "2026-11-19 16:40:00",
  },
  {
    notification_id: "f0000000-0000-4000-8000-000000000005",
    recipient_user_id: 102, // Administrador Teste — request 3 sem Responsável
    event_type: "pending_item_responded_unassigned",
    request_id: 3,
    payload: {
      type: "pending_item_responded_unassigned",
      protocol: "MAAT-2R7Q-4M1C",
      title: "Analisar inadimplência por região",
      notice: "Sem responsável designado",
    },
    dedup_key: "seed:request.pending_responded:3:102",
    read_at: null,
    created_at: "2026-11-19 16:42:00",
  },
  {
    notification_id: "f0000000-0000-4000-8000-000000000006",
    recipient_user_id: 109, // Carina Admin — request 3 sem Responsável
    event_type: "pending_item_responded_unassigned",
    request_id: 3,
    payload: {
      type: "pending_item_responded_unassigned",
      protocol: "MAAT-2R7Q-4M1C",
      title: "Analisar inadimplência por região",
      notice: "Sem responsável designado",
    },
    dedup_key: "seed:request.pending_responded:3:109",
    read_at: null,
    created_at: "2026-11-19 16:42:00",
  },
  {
    notification_id: "f0000000-0000-4000-8000-000000000007",
    recipient_user_id: 115, // Ines Admin — request 3 sem Responsável
    event_type: "pending_item_responded_unassigned",
    request_id: 3,
    payload: {
      type: "pending_item_responded_unassigned",
      protocol: "MAAT-2R7Q-4M1C",
      title: "Analisar inadimplência por região",
      notice: "Sem responsável designado",
    },
    dedup_key: "seed:request.pending_responded:3:115",
    read_at: null,
    created_at: "2026-11-19 16:42:00",
  },
  {
    notification_id: "f0000000-0000-4000-8000-000000000008",
    recipient_user_id: 101, // Analista Teste — designado da request 1 (issue #161)
    event_type: "responsible_assigned",
    request_id: 1,
    payload: {
      type: "responsible_assigned",
      protocol: "MAAT-8K3P-9X2M",
      title: "Automatizar conciliação bancária",
      category: "Automação",
      status: "Aguardando mapeamento",
    },
    dedup_key: "seed:request.assigned:1:101",
    read_at: null,
    created_at: "2026-11-19 17:00:00",
  },
  {
    notification_id: "f0000000-0000-4000-8000-000000000009",
    recipient_user_id: 107, // Roberta Analista — redesignado da request 1 (troca, issue #161)
    event_type: "responsible_assigned",
    request_id: 1,
    payload: {
      type: "responsible_assigned",
      protocol: "MAAT-8K3P-9X2M",
      title: "Automatizar conciliação bancária",
      category: "Automação",
      status: "Aguardando mapeamento",
    },
    dedup_key: "seed:request.assigned:1:107",
    read_at: null,
    created_at: "2026-11-19 17:05:00",
  },
];

/**
 * Massa fictícia dos Eventos de Notificação do RF20.
 *
 * - issue #157: `status_changed` para os solicitantes dos seeds 004 e 006;
 * - issue #159: `pending_item_responded` na request 1 (com Responsável) e
 *   `pending_item_responded_unassigned` na request 3 (sem Responsável), com o
 *   aviso explícito e os Administradores ativos do seed 004 como destinatários;
 * - issue #161: `responsible_assigned` na request 1 — designação do Analista
 *   Teste e redesignação do Roberta Analista.
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
