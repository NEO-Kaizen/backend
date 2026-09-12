export async function seed(knex) {
  await knex("criteria").del();

  await knex("criteria").insert([
    { criterion_id: "impacto_operacional", name: "Impacto operacional", weight: 10, active: true, display_order: 1, created_at: new Date(), updated_at: new Date() },
    { criterion_id: "risco_operacional", name: "Risco operacional", weight: 10, active: true, display_order: 2, created_at: new Date(), updated_at: new Date() },
    { criterion_id: "urgencia", name: "Urgência", weight: 10, active: true, display_order: 3, created_at: new Date(), updated_at: new Date() },
    { criterion_id: "volumetria", name: "Volumetria", weight: 10, active: true, display_order: 4, created_at: new Date(), updated_at: new Date() },
    { criterion_id: "esforco_manual", name: "Esforço manual", weight: 10, active: true, display_order: 5, created_at: new Date(), updated_at: new Date() },
    { criterion_id: "impacto_cliente", name: "Impacto no cliente", weight: 10, active: true, display_order: 6, created_at: new Date(), updated_at: new Date() },
    { criterion_id: "prazo_regulatorio", name: "Prazo regulatório", weight: 10, active: true, display_order: 7, created_at: new Date(), updated_at: new Date() },
    { criterion_id: "areas_impactadas", name: "Áreas impactadas", weight: 10, active: true, display_order: 8, created_at: new Date(), updated_at: new Date() },
    { criterion_id: "alinhamento_estrategico", name: "Alinhamento estratégico", weight: 10, active: true, display_order: 9, created_at: new Date(), updated_at: new Date() },
    { criterion_id: "complexidade_estimada", name: "Complexidade estimada", weight: 10, active: true, display_order: 10, created_at: new Date(), updated_at: new Date() },
  ]);
}
