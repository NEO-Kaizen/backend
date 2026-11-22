/**
 * Amplia chk_audit_history_entity_type para aceitar `profile` (issue #168).
 *
 * A entidade `profile` entra no catálogo em `src/shared/audit/auditCatalog.ts`
 * no mesmo PR: as duas listas andam juntas (docs/audit-events.md).
 *
 * @param {import("knex").Knex} knex
 */
export async function up(knex) {
  await knex.raw('ALTER TABLE "audit_history" DROP CONSTRAINT "chk_audit_history_entity_type"');
  await knex.raw(`
    ALTER TABLE "audit_history"
      ADD CONSTRAINT "chk_audit_history_entity_type"
      CHECK ("entity_type" IN ('user', 'prioritization', 'settings', 'request', 'mapping', 'pending_item', 'profile'))
  `);
}

/**
 * @param {import("knex").Knex} knex
 */
export async function down(knex) {
  await knex.raw('ALTER TABLE "audit_history" DROP CONSTRAINT "chk_audit_history_entity_type"');
  await knex.raw(`
    ALTER TABLE "audit_history"
      ADD CONSTRAINT "chk_audit_history_entity_type"
      CHECK ("entity_type" IN ('user', 'prioritization', 'settings', 'request', 'mapping', 'pending_item'))
  `);
}
