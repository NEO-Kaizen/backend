/**
 * Amplia a chk_audit_history_entity_type para aceitar a entidade
 * `prioritization` (módulo renomeado na branch issue-51).
 *
 * A migration `20260911150000_add_check_audit_history_entity_type` JÁ RODOU
 * em ambientes que continham main recente com `CHECK IN ('user')`. O catálogo
 * (`src/shared/audit/auditCatalog.ts`) passou a gravar `entity_type =
 * 'prioritization'`, o que viola a constraint original. Este ALTER é o único
 * caso previsto de ajuste em tabela já existente (fase 1.4 do plano issue-51).
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.raw('ALTER TABLE "audit_history" DROP CONSTRAINT "chk_audit_history_entity_type"');
  await knex.raw(`
    ALTER TABLE "audit_history"
      ADD CONSTRAINT "chk_audit_history_entity_type"
      CHECK ("entity_type" IN ('user', 'prioritization'))
  `);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.raw('ALTER TABLE "audit_history" DROP CONSTRAINT "chk_audit_history_entity_type"');
  await knex.raw(`
    ALTER TABLE "audit_history"
      ADD CONSTRAINT "chk_audit_history_entity_type"
      CHECK ("entity_type" IN ('user'))
  `);
}
