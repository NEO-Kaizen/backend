/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // Tabela de solicitantes (inclui responsáveis também)
  await knex.schema.createTable("solicitante", (table) => {
    table.increments("id");
    table.string("nome_completo", 150).notNullable();
    table.string("email_corporativo", 254).notNullable().unique();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
  });

  // Tabela principal de solicitações
  await knex.schema.createTable("solicitacao", (table) => {
    table.increments("id");
    table.string("protocolo", 50).notNullable().unique();
    table.string("titulo_resumido", 255).nullable();
    table.string("nome_processo_atual", 255).nullable();
    table.string("status", 50).notNullable().defaultTo("Aberto");
    table
      .integer("solicitante_id")
      .nullable()
      .references("id")
      .inTable("solicitante")
      .onDelete("SET NULL");
    table
      .integer("responsavel_id")
      .nullable()
      .references("id")
      .inTable("solicitante")
      .onDelete("SET NULL");
    table.timestamp("data_abertura").notNullable().defaultTo(knex.fn.now());
    table.timestamp("prazo_desejado").nullable();
    table.timestamp("ultima_atualizacao").notNullable().defaultTo(knex.fn.now());
  });

  // Tabela de análise de viabilidade
  await knex.schema.createTable("analise_viabilidade", (table) => {
    table.increments("id");
    table
      .integer("solicitacao_id")
      .notNullable()
      .references("id")
      .inTable("solicitacao")
      .onDelete("CASCADE");
    table.timestamp("agendar_mapeamento_na_data").nullable();
    table.string("link_reuniao", 500).nullable();
    table.text("observacoes").nullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
  });

  // Dados de teste
  const [solicitante] = await knex("solicitante")
    .insert({ nome_completo: "Maria Oliveira", email_corporativo: "maria@instituicao.gov.br" })
    .returning("id");

  await knex("solicitacao").insert({
    protocolo: "NEO-2026-001",
    titulo_resumido: "Automação do processo de RH",
    nome_processo_atual: "Processo Manual de RH",
    status: "Em análise",
    solicitante_id: solicitante.id,
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists("analise_viabilidade");
  await knex.schema.dropTableIfExists("solicitacao");
  await knex.schema.dropTableIfExists("solicitante");
}
