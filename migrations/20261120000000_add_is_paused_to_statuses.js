/**
 * Permite que um Status seja explicitamente configurado como período de pausa
 * para o cálculo de tempo ativo e pausado da solicitação.
 *
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function up(knex) {
  await knex.schema.alterTable("statuses", (table) => {
    table.boolean("is_paused").notNullable().defaultTo(false);
  });

  await knex("statuses").where({ name: "Pendente de informações" }).update({ is_paused: true });
}

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function down(knex) {
  await knex.schema.alterTable("statuses", (table) => {
    table.dropColumn("is_paused");
  });
}
