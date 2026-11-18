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
      CHECK ("entity_type" IN ('user', 'prioritization', 'settings', 'request', 'mapping', 'pending_item') )
      NOT VALID
  `);
}

/**
 * @param {import("knex").Knex} knex
 */
export async function down(knex) {
  await knex.raw('ALTER TABLE "audit_history" DROP CONSTRAINT "chk_audit_history_entity_type"');
  // `audit_history` é append-only: o rollback pode encontrar linhas com valores
  // fora da lista anterior. `NOT VALID` mantém o CHECK barrando novos INSERTs
  // sem varrer o histórico já gravado (issue #142).
  await knex.raw(`
    ALTER TABLE "audit_history"
      ADD CONSTRAINT "chk_audit_history_entity_type"
      CHECK ("entity_type" IN ('user', 'prioritization', 'settings', 'request', 'mapping'))
      NOT VALID
  `);
}
