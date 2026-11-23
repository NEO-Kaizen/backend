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
  // O `UNIQUE` global restaurado não representa um estado em que dois Perfis
  // compartilham o nome: o `up` permite homônimos entre inativos, o `down` não.
  // Falhar antes de mexer no schema evita perder nome de Perfil e deixa claro
  // o que resolver; renomear as linhas aqui seria perda silenciosa de dado.
  const firstDuplicateName = await knex("profiles")
    .select("name")
    .count("* as total")
    .groupBy("name")
    .havingRaw("count(*) > 1")
    .first();

  if (firstDuplicateName) {
    throw new Error(
      `Rollback bloqueado: o nome de Perfil "${firstDuplicateName.name}" pertence a ${firstDuplicateName.total} linhas. ` +
        "Renomeie os homônimos (inativos inclusive) antes de restaurar a unicidade global.",
    );
  }

  await knex.raw('DROP INDEX IF EXISTS "uk_profiles_active_name_lower"');
  await knex.raw('ALTER TABLE "profiles" ADD CONSTRAINT "profiles_name_unique" UNIQUE ("name")');
}
