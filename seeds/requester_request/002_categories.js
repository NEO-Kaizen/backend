export async function seed(knex) {
  await knex("categories").insert([
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
  ]);
}
