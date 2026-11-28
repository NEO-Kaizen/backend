/**
 * Snapshot de Perfil da Nota interna passa a guardar identidade e nome
 * (issue #199).
 *
 * O nome já era congelado em `author_role_at_creation`; a coluna é renomeada
 * para dizer o que contém (`role` era ambíguo), alargada para 60 — a mesma
 * largura de `profiles.name` — e ganha a identidade estável
 * `author_profile_id_at_creation`. Sem o alargamento, um Perfil customizado de
 * 31–60 caracteres faria a criação da nota estourar a coluna.
 *
 * Nenhum backfill: notas antigas só têm o nome, então o ID fica `NULL` —
 * inferi-lo a partir de um nome mutável seria inventar histórico.
 *
 * `ON DELETE RESTRICT` acompanha a trilha append-only: Perfil não é excluído
 * fisicamente e a nota não perde a identidade registrada.
 *
 * Rollback: a coluna de ID cai, o nome volta a se chamar
 * `author_role_at_creation` e a largura volta a 30. O ID registrado nas notas
 * novas é perdido. O rollback falha de forma explícita se existir nome de
 * Perfil com mais de 30 caracteres — estreitar truncaria o histórico.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.raw(`
    ALTER TABLE "request_internal_notes"
      RENAME COLUMN "author_role_at_creation" TO "author_profile_name_at_creation"
  `);

  await knex.raw(`
    ALTER TABLE "request_internal_notes"
      ALTER COLUMN "author_profile_name_at_creation" TYPE varchar(60)
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
  const longName = await knex("request_internal_notes")
    .whereRaw('char_length("author_profile_name_at_creation") > 30')
    .first("internal_note_id");

  if (longName) {
    throw new Error(
      "Rollback bloqueado: existe Nota interna com nome de Perfil acima de 30 caracteres. " +
        "Estreitar a coluna truncaria o snapshot; ajuste os dados antes de repetir o rollback.",
    );
  }

  await knex.schema.alterTable("request_internal_notes", (table) => {
    table.dropColumn("author_profile_id_at_creation");
  });

  await knex.raw(`
    ALTER TABLE "request_internal_notes"
      ALTER COLUMN "author_profile_name_at_creation" TYPE varchar(30)
  `);

  await knex.raw(`
    ALTER TABLE "request_internal_notes"
      RENAME COLUMN "author_profile_name_at_creation" TO "author_role_at_creation"
  `);
}
