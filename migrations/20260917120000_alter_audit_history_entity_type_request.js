/**
 * Amplia a chk_audit_history_entity_type para aceitar a entidade `request`
 * (atribuição de responsável e gatilho de status RN-010 — issue #50).
 *
 * Mantém as entidades já aceitas pela `main` (`settings` — issue #59):
 * esta migration roda depois e recria o CHECK por inteiro.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.raw('ALTER TABLE "audit_history" DROP CONSTRAINT "chk_audit_history_entity_type"');
  await knex.raw(`
    ALTER TABLE "audit_history"
      ADD CONSTRAINT "chk_audit_history_entity_type"
      CHECK ("entity_type" IN ('user', 'prioritization', 'settings', 'request'))
  `);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.raw('ALTER TABLE "audit_history" DROP CONSTRAINT "chk_audit_history_entity_type"');
  // `audit_history` é append-only: o rollback pode encontrar linhas com valores
  // fora da lista anterior. `NOT VALID` mantém o CHECK barrando novos INSERTs
  // sem varrer o histórico já gravado (issue #142).
  await knex.raw(`
    ALTER TABLE "audit_history"
      ADD CONSTRAINT "chk_audit_history_entity_type"
      CHECK ("entity_type" IN ('user', 'prioritization', 'settings'))
      NOT VALID
  `);
}
