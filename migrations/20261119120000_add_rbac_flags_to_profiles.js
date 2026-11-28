/**
 * Perfis ganham a marca de Admin Root e as duas flags de Atribuibilidade.
 *
 * `is_root` é escrita exclusiva do seed (contrato RBAC § 4.2); o índice
 * parcial garante no máximo um Perfil Admin Root no banco.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.alterTable("profiles", (table) => {
    table.boolean("is_root").notNullable().defaultTo(false);
    table.boolean("is_assignable_triage").notNullable().defaultTo(false);
    table.boolean("is_assignable_mapping").notNullable().defaultTo(false);
  });

  await knex.raw("CREATE UNIQUE INDEX uk_profiles_single_root ON profiles (is_root) WHERE is_root");
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.raw("DROP INDEX IF EXISTS uk_profiles_single_root");

  await knex.schema.alterTable("profiles", (table) => {
    table.dropColumn("is_root");
    table.dropColumn("is_assignable_triage");
    table.dropColumn("is_assignable_mapping");
  });
}
