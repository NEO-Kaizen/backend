export async function seed(knex) {
  await knex("priorities")
    .insert([
      {
        priority_id: 1,
        level: "Baixa",
        min_score: 10.0,
        max_score: 20.0,
        default_weight: 0.25,
        color_code: "#90EE90",
        description: "Baixa urgência, impacto reduzido",
      },
      {
        priority_id: 2,
        level: "Média",
        min_score: 20.1,
        max_score: 30.0,
        default_weight: 0.5,
        color_code: "#FFD700",
        description: "Média urgência, impacto moderado",
      },
      {
        priority_id: 3,
        level: "Alta",
        min_score: 30.1,
        max_score: 40.0,
        default_weight: 0.75,
        color_code: "#FF8C00",
        description: "Alta urgência, impacto significativo",
      },
      {
        priority_id: 4,
        level: "Crítica",
        min_score: 40.1,
        max_score: 50.0,
        default_weight: 1.0,
        color_code: "#FF0000",
        description: "Crítica, impacto crítico no negócio",
      },
    ])
    .onConflict("priority_id")
    .merge();

  await knex.raw(
    "SELECT setval('priorities_priority_id_seq', (SELECT COALESCE(MAX(priority_id), 1) FROM priorities))",
  );
}
