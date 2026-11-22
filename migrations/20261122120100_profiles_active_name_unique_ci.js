/**
 * Unicidade do nome do Perfil passa a ser case-insensitive e restrita aos
 * Perfis ativos (contrato `docs/custom-roles.md` § 2.2 e issue #168).
 *
 * O `UNIQUE` global anterior impedia reaproveitar o nome de um Perfil inativo e
 * ignorava a caixa. O índice parcial espelha a regra de negócio exata:
 * `lower(name)` único apenas entre `is_active = TRUE`. Perfis inativos guardam
 * o nome que tinham, e reativar um deles revalida a colisão.
 *
 * @param {import("knex").Knex} knex
 */
export async function up(knex) {
  await knex.raw('ALTER TABLE "profiles" DROP CONSTRAINT IF EXISTS "profiles_name_unique"');
  await knex.raw(`
    CREATE UNIQUE INDEX "uk_profiles_active_name_lower"
      ON "profiles" (lower("name"))
      WHERE "is_active"
  `);
}

/**
 * @param {import("knex").Knex} knex
 */
export async function down(knex) {
  await knex.raw('DROP INDEX IF EXISTS "uk_profiles_active_name_lower"');
  await knex.raw('ALTER TABLE "profiles" ADD CONSTRAINT "profiles_name_unique" UNIQUE ("name")');
}
