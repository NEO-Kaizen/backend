export async function up(knex) {
  await knex.schema.createTable("avaliacoes", (table) => {
    table.string("protocolo", 25).primary();
    table.decimal("score", 5, 2).notNullable();
    table.enu("classificacao", ["baixa", "media", "alta", "critica"], { useNative: true, enumName: "avaliacao_classificacao" }).notNullable();
    table.timestamp("calculado_em", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.string("calculado_por", 100).notNullable();
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true });
  });

  await knex.schema.createTable("notas", (table) => {
    table.increments("nota_id").primary();
    table.string("protocolo", 25).notNullable();
    table.string("criterio_id", 50).notNullable();
    table.integer("nota").notNullable();
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.alterTable("notas", (table) => {
    table.index("protocolo", "idx_notas_protocolo");
    table.index("criterio_id", "idx_notas_criterio");
    table.unique(["protocolo", "criterio_id"], { indexName: "uk_notas_protocolo_criterio" });
  });

  await knex.schema.createTable("historico_priorizacao", (table) => {
    table.increments("historico_id").primary();
    table.string("protocolo", 25).notNullable();
    table.decimal("score_anterior", 5, 2).notNullable();
    table.enu("classificacao_anterior", ["baixa", "media", "alta", "critica"], { useNative: true, enumName: "historico_classificacao" }).notNullable();
    table.decimal("score_novo", 5, 2).notNullable();
    table.enu("classificacao_nova", ["baixa", "media", "alta", "critica"], { useNative: true, enumName: "historico_classificacao_nova" }).notNullable();
    table.string("usuario", 100).notNullable();
    table.text("motivo");
    table.timestamp("criado_em", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.alterTable("historico_priorizacao", (table) => {
    table.index("protocolo", "idx_historico_protocolo");
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists("historico_priorizacao");
  await knex.schema.dropTableIfExists("notas");
  await knex.schema.dropTableIfExists("avaliacoes");
  await knex.raw('DROP TYPE IF EXISTS "avaliacao_classificacao"');
  await knex.raw('DROP TYPE IF EXISTS "historico_classificacao"');
  await knex.raw('DROP TYPE IF EXISTS "historico_classificacao_nova"');
}
