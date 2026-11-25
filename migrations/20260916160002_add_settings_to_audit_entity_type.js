/**
 * Amplia a `chk_audit_history_entity_type` para aceitar a entidade `settings`
 * (configuração do portal — endpoints `/portal-config`, issue #59).
 *
 * O CHECK é a fonte de verdade em nível de banco das entidades do
 * `auditCatalog` (src/shared/audit/auditCatalog.ts) — ao adicionar uma
 * entidade no catálogo, atualize também esta lista.
 */
export async function up(knex) {
  await knex.raw('ALTER TABLE "audit_history" DROP CONSTRAINT "chk_audit_history_entity_type"');
  await knex.raw(`
    ALTER TABLE "audit_history"
      ADD CONSTRAINT "chk_audit_history_entity_type"
      CHECK ("entity_type" IN ('user', 'prioritization', 'settings'))
  `);
}

export async function down(knex) {
  await knex.raw('ALTER TABLE "audit_history" DROP CONSTRAINT "chk_audit_history_entity_type"');
  // `audit_history` é append-only: o rollback pode encontrar linhas com valores
  // fora da lista anterior. `NOT VALID` mantém o CHECK barrando novos INSERTs
  // sem varrer o histórico já gravado (issue #142).
  await knex.raw(`
    ALTER TABLE "audit_history"
      ADD CONSTRAINT "chk_audit_history_entity_type"
      CHECK ("entity_type" IN ('user', 'prioritization'))
      NOT VALID
  `);
}
