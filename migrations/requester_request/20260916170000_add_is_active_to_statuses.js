/**
 * Flag de ativação dos status — habilita a R7 (PATCH /portal-config/statuses)
 * a "desativar" um status sem hard delete (o contrato de solicitações mantém a
 * FK `requests.status_id` RESTRICT). Backfill: todos os 17 de referência ativos.
 */
export async function up(knex) {
  await knex.schema.alterTable("statuses", (table) => {
    table.boolean("is_active").notNullable().defaultTo(false);
  });

  await knex("statuses").update({ is_active: true });
}

export async function down(knex) {
  await knex.schema.alterTable("statuses", (table) => {
    table.dropColumn("is_active");
  });
}
