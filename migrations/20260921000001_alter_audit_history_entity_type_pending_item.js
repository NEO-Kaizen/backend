/**
 * Amplia chk_audit_history_entity_type para aceitar `pending_item` (issue #176).
 *
 * @param {import("knex").Knex} knex
 */
export async function up(knex) {
  await knex.raw('ALTER TABLE "audit_history" DROP CONSTRAINT "chk_audit_history_entity_type"');
  await knex.raw(`
    ALTER TABLE "audit_history"
      ADD CONSTRAINT "chk_audit_history_entity_type"
      CHECK ("entity_type" IN ('user', 'prioritization', 'settings', 'request', 'mapping', 'pending_item'))
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
      CHECK ("entity_type" IN ('user', 'prioritization', 'settings', 'request', 'mapping'))
  `);
}
