export async function seed(knex) {
  const tables = [
    "attachments",
    "pending_items",
    "requests",
    "protocol_sequences",
    "professionals",
    "priorities",
    "categories",
    "statuses",
    "requesters",
  ];

  for (const table of tables) {
    await knex.raw(`TRUNCATE TABLE "${table}" CASCADE`);
  }

  await knex("requesters").insert([
    {
      requester_id: "550e8400-e29b-41d4-a716-446655440001",
      full_name: "Maria Silva",
      corporate_email: "maria.silva@empresa.com",
      area: "Financeiro",
      department: "Contabilidade",
      manager_name: "José Carlos",
      additional_contact: "(11) 98765-4321",
      created_at: "2026-07-01 09:00:00",
    },
    {
      requester_id: "550e8400-e29b-41d4-a716-446655440002",
      full_name: "Carlos Oliveira",
      corporate_email: "carlos.oliveira@empresa.com",
      area: "Comercial",
      department: "Inteligência de Mercado",
      manager_name: "Fernanda Lima",
      additional_contact: "(11) 91234-5678",
      created_at: "2026-07-02 10:30:00",
    },
    {
      requester_id: "550e8400-e29b-41d4-a716-446655440003",
      full_name: "Ana Paula Santos",
      corporate_email: "ana.santos@empresa.com",
      area: "Operações",
      department: "Logística",
      manager_name: "Ricardo Nunes",
      created_at: "2026-07-05 14:15:00",
    },
  ]);
}
