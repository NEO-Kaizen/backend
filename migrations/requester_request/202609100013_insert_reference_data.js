const CATEGORIES = [
  {
    category_id: 1,
    name: "Automação",
    description: "Solicitações de automação de atividades operacionais",
    status: "active",
  },
  {
    category_id: 2,
    name: "Melhoria de processo",
    description: "Revisão, simplificação ou padronização de fluxo",
    status: "active",
  },
  {
    category_id: 3,
    name: "Indicador",
    description: "Criação ou evolução de métrica operacional",
    status: "active",
  },
  {
    category_id: 4,
    name: "Dashboard ou relatório",
    description: "Construção de visualização ou relatório gerencial",
    status: "active",
  },
  {
    category_id: 5,
    name: "Análise de dados",
    description: "Tratamento, cruzamento ou exploração de dados",
    status: "active",
  },
  {
    category_id: 6,
    name: "Padronização",
    description: "Definição de modelos, controles ou procedimentos",
    status: "active",
  },
  {
    category_id: 7,
    name: "Revisão de processo",
    description: "Diagnóstico de processo existente",
    status: "active",
  },
  {
    category_id: 8,
    name: "Apoio técnico",
    description: "Avaliação ou suporte dentro do escopo do NEO",
    status: "active",
  },
  {
    category_id: 9,
    name: "Estudo de viabilidade",
    description: "Análise preliminar de aderência, esforço e benefício",
    status: "active",
  },
  {
    category_id: 10,
    name: "Outros",
    description: "Solicitação ainda não coberta pelas categorias anteriores",
    status: "active",
  },
];

const STATUSES = [
  {
    status_id: 1,
    order_number: 1,
    name: "Solicitação enviada",
    description: "Registrada pelo solicitante",
    is_final: false,
    is_triage_exit: false,
  },
  {
    status_id: 2,
    order_number: 2,
    name: "Aguardando triagem",
    description: "Na fila para análise da equipe NEO",
    is_final: false,
    is_triage_exit: false,
  },
  {
    status_id: 3,
    order_number: 3,
    name: "Em triagem",
    description: "Sendo analisada pela equipe NEO",
    is_final: false,
    is_triage_exit: false,
  },
  {
    status_id: 4,
    order_number: 4,
    name: "Pendente de informações",
    description: "Aguardando complemento do solicitante",
    is_final: false,
    is_triage_exit: true,
  },
  {
    status_id: 5,
    order_number: 5,
    name: "Aguardando mapeamento",
    description: "Elegível, aguardando agenda de mapeamento",
    is_final: false,
    is_triage_exit: false,
  },
  {
    status_id: 6,
    order_number: 6,
    name: "Mapeamento agendado",
    description: "Reunião de levantamento marcada",
    is_final: false,
    is_triage_exit: false,
  },
  {
    status_id: 7,
    order_number: 7,
    name: "Em mapeamento",
    description: "Levantamento do processo em andamento",
    is_final: false,
    is_triage_exit: false,
  },
  {
    status_id: 8,
    order_number: 8,
    name: "Em análise de viabilidade",
    description: "Avaliação técnica, de impacto e esforço",
    is_final: false,
    is_triage_exit: false,
  },
  {
    status_id: 9,
    order_number: 9,
    name: "Elegível",
    description: "Aprovada para priorização",
    is_final: false,
    is_triage_exit: true,
  },
  {
    status_id: 10,
    order_number: 10,
    name: "Não elegível",
    description: "Rejeitada na triagem",
    is_final: true,
    is_triage_exit: false,
  },
  {
    status_id: 11,
    order_number: 11,
    name: "Priorizado",
    description: "Recebeu nível de prioridade",
    is_final: false,
    is_triage_exit: false,
  },
  {
    status_id: 12,
    order_number: 12,
    name: "Backlog",
    description: "Aguardando disponibilidade de execução",
    is_final: false,
    is_triage_exit: true,
  },
  {
    status_id: 13,
    order_number: 13,
    name: "Direcionado para outra área",
    description: "Encaminhada a outro departamento",
    is_final: true,
    is_triage_exit: true,
  },
  {
    status_id: 14,
    order_number: 14,
    name: "Em desenvolvimento",
    description: "Em execução pela equipe",
    is_final: false,
    is_triage_exit: false,
  },
  {
    status_id: 15,
    order_number: 15,
    name: "Em homologação",
    description: "Em validação com o solicitante",
    is_final: false,
    is_triage_exit: false,
  },
  {
    status_id: 16,
    order_number: 16,
    name: "Concluído",
    description: "Entregue e validado",
    is_final: true,
    is_triage_exit: false,
  },
  {
    status_id: 17,
    order_number: 17,
    name: "Cancelado",
    description: "Encerrado sem execução",
    is_final: true,
    is_triage_exit: true,
  },
  {
    status_id: 18,
    order_number: 18,
    name: "Elegível para avaliação",
    description: "Demanda elegível para seguir a próxima etapa de avaliação",
    is_final: false,
    is_triage_exit: true,
  },
  {
    status_id: 19,
    order_number: 19,
    name: "Fora do escopo",
    description: "Solicitação fora do escopo do NEO",
    is_final: true,
    is_triage_exit: true,
  },
  {
    status_id: 20,
    order_number: 20,
    name: "Direcionada para outra área",
    description: "Encaminhada para outra área de negócio ou suporte",
    is_final: true,
    is_triage_exit: true,
  },
  {
    status_id: 21,
    order_number: 21,
    name: "Duplicada",
    description: "Solicitação duplicada de outra demanda",
    is_final: true,
    is_triage_exit: true,
  },
  {
    status_id: 22,
    order_number: 22,
    name: "Cancelada",
    description: "Solicitação cancelada durante a triagem",
    is_final: true,
    is_triage_exit: true,
  },
];

export async function up(knex) {
  await knex("categories").insert(CATEGORIES).onConflict("category_id").ignore();
  await knex("statuses").insert(STATUSES).onConflict("status_id").ignore();

  await knex("statuses")
    .whereIn("name", [
      "Pendente de informações",
      "Elegível",
      "Elegível para avaliação",
      "Backlog",
      "Direcionado para outra área",
      "Direcionada para outra área",
      "Cancelado",
      "Cancelada",
    ])
    .update({ is_triage_exit: true });

  await knex.raw(
    "SELECT setval('categories_category_id_seq', (SELECT COALESCE(MAX(category_id), 1) FROM categories))",
  );
  await knex.raw(
    "SELECT setval('statuses_status_id_seq', (SELECT COALESCE(MAX(status_id), 1) FROM statuses))",
  );
}

export async function down(knex) {
  await knex("statuses")
    .whereIn(
      "status_id",
      STATUSES.map((status) => status.status_id),
    )
    .del();
  await knex("categories")
    .whereIn(
      "category_id",
      CATEGORIES.map((category) => category.category_id),
    )
    .del();
}
