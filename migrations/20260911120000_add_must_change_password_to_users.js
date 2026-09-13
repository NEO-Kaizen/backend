/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable("users", (table) => {
    table.boolean("must_change_password").notNullable().defaultTo(false);
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.alterTable("users", (table) => {
    table.dropColumn("must_change_password");
  });
}
