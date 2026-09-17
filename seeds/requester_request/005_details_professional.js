export async function seed(knex) {
  await knex("details_professional").insert([
    {
      professional_id: "650e8400-e29b-41d4-a716-446655440001",
      user_id: 101, // Analista Teste
      job_title: "Analista de Processos",
      specialties: "Automação, Análise de dados, Melhoria",
      attended_category_ids: "1,2,5",
      status: "active",
      capacity: 8,
    },
    {
      professional_id: "650e8400-e29b-41d4-a716-446655440002",
      user_id: 107, // Roberta Analista
      job_title: "Desenvolvedora",
      specialties: "RPA, Integrações, Dashboards",
      attended_category_ids: "1,4",
      status: "active",
      capacity: 10,
    },
    {
      professional_id: "650e8400-e29b-41d4-a716-446655440003",
      user_id: 108, // Bruno Analista
      job_title: "Mapeador de Processos",
      specialties: "BPMN, Documentação de fluxos",
      attended_category_ids: "2,6,7",
      status: "active",
      capacity: 6,
    },
    {
      professional_id: "650e8400-e29b-41d4-a716-446655440004",
      user_id: 110, // Diego Analista
      job_title: "Especialista em RPA",
      specialties: "Automação RPA, UiPath",
      attended_category_ids: "1",
      status: "active",
      capacity: 7,
      notes: "Foco em robôs de alta volumetria.",
    },
    {
      professional_id: "650e8400-e29b-41d4-a716-446655440005",
      user_id: 114, // Hugo Analista
      job_title: "Analista de Dados",
      specialties: "SQL, ETL, Python",
      attended_category_ids: "5",
      status: "active",
      capacity: 8,
    },
    {
      professional_id: "650e8400-e29b-41d4-a716-446655440006",
      user_id: 103, // Gestor Teste
      job_title: "Consultor de Indicadores",
      specialties: "Indicadores, Métricas, OKRs",
      attended_category_ids: "3,9",
      status: "active",
      capacity: 5,
    },
    {
      professional_id: "650e8400-e29b-41d4-a716-446655440007",
      user_id: 106, // Ana Gestora
      job_title: "Especialista em Padronização",
      specialties: "Procedimentos, Modelos, Governança",
      attended_category_ids: "6,7",
      status: "active",
      capacity: 5,
    },
    {
      professional_id: "650e8400-e29b-41d4-a716-446655440008",
      user_id: 111, // Elisa Gestora
      job_title: "Especialista em Viabilidade",
      specialties: "Pesquisa de viabilidade, Estimativas",
      attended_category_ids: "9",
      status: "inactive",
      capacity: 4,
      notes: "Em licença — loga no sistema mas não recebe atribuição.",
    },
  ]);
}
