export async function seed(knex) {
  await knex("attachments").insert([
    {
      attachment_id: "cc000000-0000-4000-8000-000000000001",
      request_id: "aa000000-0000-4000-8000-000000000001",
      pending_item_id: "00000000-0000-4000-8000-000000000099",
      file_name: "modelo_conciliacao.xlsx",
      file_path: "/uploads/maat-2026-000001/modelo_conciliacao.xlsx",
      content_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      size_bytes: 245760,
      is_restricted: true,
      uploaded_by: "maria.silva@empresa.com",
      uploaded_at: "2026-07-19 15:30:00",
    },
    {
      attachment_id: "cc000000-0000-4000-8000-000000000002",
      request_id: "aa000000-0000-4000-8000-000000000001",
      file_name: "fluxo_atual.pdf",
      file_path: "/uploads/maat-2026-000001/fluxo_atual.pdf",
      content_type: "application/pdf",
      size_bytes: 412000,
      is_restricted: false,
      uploaded_by: "joao.analyst@empresa.com",
      uploaded_at: "2026-07-15 12:45:00",
    },
  ]);
}
