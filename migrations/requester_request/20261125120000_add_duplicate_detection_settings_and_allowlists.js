/**
 * RF16 (issue #209) — flag da detecção de duplicidade e allowlists de corpus.
 *
 * - `system_settings.duplicate_detection_enabled` nasce `false`: a
 *   funcionalidade só é exposta depois do canário de RN04 e da calibração.
 * - `categories.is_publicly_listable` nasce `false` para cadastros novos; a
 *   migration liga as categorias existentes.
 * - `statuses.is_duplicate_corpus_eligible` nasce `true`; os desfechos fora do
 *   corpus (10, 13, 16, 17 e 19) são desligados.
 *
 * Regras em `docs/rules/duplicate-detection.md`.
 */
const INELIGIBLE_STATUS_IDS = [10, 13, 16, 17, 19];

export async function up(knex) {
  await knex.schema.alterTable("system_settings", (table) => {
    table.boolean("duplicate_detection_enabled").notNullable().defaultTo(false);
  });

  await knex.schema.alterTable("categories", (table) => {
    table.boolean("is_publicly_listable").notNullable().defaultTo(false);
  });
  await knex("categories").update({ is_publicly_listable: true });

  await knex.schema.alterTable("statuses", (table) => {
    table.boolean("is_duplicate_corpus_eligible").notNullable().defaultTo(true);
  });
  await knex("statuses")
    .whereIn("status_id", INELIGIBLE_STATUS_IDS)
    .update({ is_duplicate_corpus_eligible: false });
}

export async function down(knex) {
  await knex.schema.alterTable("statuses", (table) => {
    table.dropColumn("is_duplicate_corpus_eligible");
  });

  await knex.schema.alterTable("categories", (table) => {
    table.dropColumn("is_publicly_listable");
  });

  await knex.schema.alterTable("system_settings", (table) => {
    table.dropColumn("duplicate_detection_enabled");
  });
}
