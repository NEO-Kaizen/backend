/**
 * Restores `profile` to the audit entity CHECK after the queue/reports
 * migration recreated the constraint without the entity added by issue #168.
 *
 * @param {import("knex").Knex} knex
 */
export async function up(knex) {
  await knex.raw('ALTER TABLE "audit_history" DROP CONSTRAINT "chk_audit_history_entity_type"');
  await knex.raw(`
    ALTER TABLE "audit_history"
      ADD CONSTRAINT "chk_audit_history_entity_type"
      CHECK ("entity_type" IN (
        'user', 'prioritization', 'settings', 'request', 'mapping',
        'pending_item', 'queue', 'reports', 'profile'
      ))
  `);
}

/**
 * @param {import("knex").Knex} knex
 */
export async function down(knex) {
  const rows = await knex("audit_history").where("entity_type", "profile").count("* as total");
  const total = Number(rows[0]?.total ?? 0);

  if (total > 0) {
    throw new Error(
      "Não é possível remover a entidade de auditoria `profile` que já possui eventos.",
    );
  }

  await knex.raw('ALTER TABLE "audit_history" DROP CONSTRAINT "chk_audit_history_entity_type"');
  await knex.raw(`
    ALTER TABLE "audit_history"
      ADD CONSTRAINT "chk_audit_history_entity_type"
      CHECK ("entity_type" IN (
        'user', 'prioritization', 'settings', 'request', 'mapping',
        'pending_item', 'queue', 'reports'
      ))
  `);
}
