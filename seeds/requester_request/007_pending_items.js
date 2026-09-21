// Pendências determinísticas consumidas por `008_attachments.js`.
// Os `pending_item_id` abaixo são fixos e casam com `attachments.pending_item_id`
// (FK `attachments_pending_item_id_foreign`): alterar um lado exige alterar o outro.
// Compatível com `20260921000002_pending_items_contract_02.js` (cycle
// requested → responded → validated, type field_edit|observation) e com a
// remoção de `is_visible_to_requester` (`20260922000000`).
export async function seed(knex) {
  await knex("pending_items").del();

  await knex("pending_items").insert([
    {
      pending_item_id: "00000000-0000-4000-8000-000000000099",
      request_id: 1,
      batch_id: "bb000000-0000-4000-8000-000000000001",
      type: "observation",
      description: "Exemplo: favor esclarecer a descrição da necessidade.",
      comment: "Exemplo: favor esclarecer a descrição da necessidade.",
      status: "requested",
      request_attachment: true,
      created_by: "seed@empresa.com",
      created_at: "2026-07-19 15:30:00",
    },
    {
      pending_item_id: "00000000-0000-4000-8000-000000000088",
      request_id: 6,
      batch_id: "bb000000-0000-4000-8000-000000000006",
      type: "observation",
      description: "Exemplo: revisar as cláusulas contratuais anexadas.",
      comment: "Exemplo: revisar as cláusulas contratuais anexadas.",
      status: "requested",
      request_attachment: true,
      created_by: "seed@empresa.com",
      created_at: "2026-09-01 10:10:00",
    },
    {
      pending_item_id: "00000000-0000-4000-8000-000000000085",
      request_id: 3,
      batch_id: "bb000000-0000-4000-8000-000000000003",
      type: "observation",
      description: "Exemplo: enviar a base de inadimplência consolidada.",
      comment: "Exemplo: enviar a base de inadimplência consolidada.",
      status: "requested",
      request_attachment: true,
      created_by: "seed@empresa.com",
      created_at: "2026-09-06 14:20:00",
    },
    {
      pending_item_id: "00000000-0000-4000-8000-000000000080",
      request_id: 2,
      batch_id: "bb000000-0000-4000-8000-000000000002",
      type: "observation",
      description: "Exemplo: anexar o pipeline semanal atualizado.",
      comment: "Exemplo: anexar o pipeline semanal atualizado.",
      status: "requested",
      request_attachment: true,
      created_by: "seed@empresa.com",
      created_at: "2026-08-27 11:15:00",
    },
    {
      pending_item_id: "00000000-0000-4000-8000-000000000084",
      request_id: 4,
      batch_id: "bb000000-0000-4000-8000-000000000004",
      type: "observation",
      description: "Exemplo: detalhar o SLA acordado com as transportadoras.",
      comment: "Exemplo: detalhar o SLA acordado com as transportadoras.",
      status: "requested",
      request_attachment: true,
      created_by: "seed@empresa.com",
      created_at: "2026-09-05 08:50:00",
    },
    {
      pending_item_id: "00000000-0000-4000-8000-000000000079",
      request_id: 11,
      batch_id: "bb000000-0000-4000-8000-000000000011",
      type: "observation",
      description: "Exemplo: enviar um lote de NFe de exemplo para validação.",
      comment: "Exemplo: enviar um lote de NFe de exemplo para validação.",
      status: "requested",
      request_attachment: true,
      created_by: "seed@empresa.com",
      created_at: "2026-09-08 09:20:00",
    },
  ]);
}
