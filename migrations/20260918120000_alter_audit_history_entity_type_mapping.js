/**
 * Amplia a chk_audit_history_entity_type para aceitar a entidade `mapping`
 * (agendamento e conclusão de mapeamento na fila — issue #86).
 *
 * Mantém as entidades já aceitas (`user`, `prioritization`, `settings`,
 * `request`): esta migration roda depois e recria o CHECK por inteiro.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.raw('ALTER TABLE "audit_history" DROP CONSTRAINT "chk_audit_history_entity_type"');
  await knex.raw(`
    ALTER TABLE "audit_history"
      ADD CONSTRAINT "chk_audit_history_entity_type"
      CHECK ("entity_type" IN ('user', 'prioritization', 'settings', 'request', 'mapping') )
      NOT VALID
  `);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.raw('ALTER TABLE "audit_history" DROP CONSTRAINT "chk_audit_history_entity_type"');
  // `audit_history` é append-only: o rollback pode encontrar linhas `mapping`
  // gravadas antes (issue #142). `NOT VALID` mantém o CHECK barrando novos
  // INSERTs sem varrer o histórico já gravado.
  await knex.raw(`
    ALTER TABLE "audit_history"
      ADD CONSTRAINT "chk_audit_history_entity_type"
      CHECK ("entity_type" IN ('user', 'prioritization', 'settings', 'request'))
      NOT VALID
  `);
}
