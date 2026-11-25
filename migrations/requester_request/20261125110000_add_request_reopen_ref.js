/**
 * Identidade do ciclo de reabertura.
 *
 * `last_reopened_at` continua sendo o marco temporal que separa os dados
 * operacionais (pendências, mapeamentos e avaliações). A identidade do ciclo
 * passa a ser um UUID imutável, para que duas reaberturas nunca compartilhem a
 * mesma referência por coincidência de relógio, fuso ou representação textual.
 *
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function up(knex) {
  await knex.schema.alterTable("requests", (table) => {
    table.uuid("reopen_ref").nullable();
  });

  // Pedidos já reabertos antes desta migration recebem uma identidade própria.
  await knex("requests")
    .whereNotNull("last_reopened_at")
    .update({ reopen_ref: knex.raw("gen_random_uuid()") });
}

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function down(knex) {
  await knex.schema.alterTable("requests", (table) => {
    table.dropColumn("reopen_ref");
  });
}
