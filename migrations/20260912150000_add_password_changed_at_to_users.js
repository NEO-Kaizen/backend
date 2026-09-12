/**
 * Passa a registrar quando a senha do usuário foi alterada pela última vez.
 *
 * O valor é embutido nos JWTs emitidos a partir daquele momento e comparado
 * pelo middleware de autenticação a cada request. Quando a senha é trocada ou
 * redefinida, o valor avança e todos os tokens emitidos anteriormente são
 * rejeitados — efetiva a revogação permanente de sessões que um simples
 * must_change_password não garantia.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable("users", (table) => {
    table.timestamp("password_changed_at").notNullable().defaultTo(knex.fn.now());
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.alterTable("users", (table) => {
    table.dropColumn("password_changed_at");
  });
}
