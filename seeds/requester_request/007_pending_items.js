import { randomUUID } from "node:crypto";

export async function seed(knex) {
  await knex("pending_items").del();

  // Exemplo mínimo compatível com contract-pendencias_03 (field_edit/observation, requested/responded/validated)
  // Útil para `npm run db:setup` manual — não é exigido pelo contrato (fluxo é via POST /pending-items).
  const request = await knex("requests").first("request_id");
  if (!request) return;

  const batchId = randomUUID();
  await knex("pending_items").insert([
    {
      pending_item_id: randomUUID(),
      request_id: request.request_id,
      batch_id: batchId,
      type: "observation",
      field_key: null,
      field_label: null,
      current_value: null,
      comment: "Exemplo: favor esclarecer a descrição da necessidade.",
      description: "Exemplo: favor esclarecer a descrição da necessidade.",
      status: "requested",
      corrected_value: null,
      response_text: null,
      deadline: null,
      request_attachment: false,
      created_by: "seed@empresa.com",
      created_at: knex.fn.now(),
      responded_at: null,
      validated_at: null,
    },
  ]);
}
