/**
 * Garante em nível de banco que `entity_type` só aceite valores do
 * catálogo de auditoria (fonte: `src/shared/audit/auditCatalog.ts`).
 *
 * Ao adicionar uma entidade no catálogo, atualize também esta lista.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.raw(`
    ALTER TABLE "audit_history"
      ADD CONSTRAINT "chk_audit_history_entity_type"
      CHECK ("entity_type" IN ('user'))
  `);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.raw(`
    ALTER TABLE "audit_history"
      DROP CONSTRAINT "chk_audit_history_entity_type"
  `);
}
