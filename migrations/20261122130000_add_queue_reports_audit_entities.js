/**
 * Permite auditar recusas sem protocolo nas rotas de Fila e Relatórios.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
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

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  const rows = await knex("audit_history")
    .whereIn("entity_type", ["queue", "reports"])
    .count("* as total");
  const total = Number(rows[0]?.total ?? 0);
  if (total > 0) {
    throw new Error("Não é possível remover entidades de auditoria que já possuem eventos.");
  }

  await knex.raw('ALTER TABLE "audit_history" DROP CONSTRAINT "chk_audit_history_entity_type"');
  await knex.raw(`
    ALTER TABLE "audit_history"
      ADD CONSTRAINT "chk_audit_history_entity_type"
      CHECK ("entity_type" IN (
        'user', 'prioritization', 'settings', 'request', 'mapping', 'pending_item'
      ))
  `);
}
