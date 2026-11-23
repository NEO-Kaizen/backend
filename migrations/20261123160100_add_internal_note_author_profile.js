/**
 * Snapshot de Perfil da Nota interna passa a guardar identidade e nome
 * (issue #199).
 *
 * O nome já era congelado em `author_role_at_creation`; a coluna é renomeada
 * para dizer o que contém (`role` era ambíguo) e ganha a identidade estável
 * `author_profile_id_at_creation`. Nenhum backfill: notas antigas só têm o
 * nome, então o ID fica `NULL` — inferi-lo a partir de um nome mutável seria
 * inventar histórico.
 *
 * `ON DELETE RESTRICT` acompanha a trilha append-only: Perfil não é excluído
 * fisicamente e a nota não perde a identidade registrada.
 *
 * Rollback: a coluna de ID cai e o nome volta a se chamar
 * `author_role_at_creation`; o ID registrado nas notas novas é perdido, o nome
 * histórico permanece.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.raw(`
    ALTER TABLE "request_internal_notes"
      RENAME COLUMN "author_role_at_creation" TO "author_profile_name_at_creation"
  `);

  await knex.schema.alterTable("request_internal_notes", (table) => {
    table
      .integer("author_profile_id_at_creation")
      .nullable()
      .references("profile_id")
      .inTable("profiles")
      .onDelete("RESTRICT");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.alterTable("request_internal_notes", (table) => {
    table.dropColumn("author_profile_id_at_creation");
  });

  await knex.raw(`
    ALTER TABLE "request_internal_notes"
      RENAME COLUMN "author_profile_name_at_creation" TO "author_role_at_creation"
  `);
}
