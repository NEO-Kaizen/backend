/**
 * Revisão do banco (issue #130) — ajustes finos e limpeza de legados.
 * Complementa `20260927000000_database_review_improvements.js`.
 *
 * 1. Unicidade case-insensitive de e-mails: a aplicação já normaliza para
 *    lowercase antes de gravar/consultar, mas o banco só garantia a regra com
 *    comparação case-sensitive. O `CREATE UNIQUE INDEX` aborta a migration se
 *    existirem duplicatas divergentes em caixa.
 * 2. CHECK de consistência entre `mappings.is_concluded` e `concluded_at` — a
 *    aplicação sempre grava os dois juntos (mapping.repository.ts).
 * 3. Índice composto para a timeline de auditoria de uma solicitação, que
 *    filtra por `(entity_type, entity_id)` e ordena por `occurred_at`/`audit_id`.
 * 4. Remoção de colunas legadas substituídas por `triages.*` e pelo contrato 03
 *    de pendências, além do índice ocioso de `attachments.is_restricted`.
 *
 * Nenhuma coluna usada pela aplicação é removida.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // `CONCURRENTLY` não cabe aqui: o Knex roda cada migration em transação e o
  // PostgreSQL proíbe `CREATE INDEX CONCURRENTLY` dentro de transação. A
  // construção dos índices únicos deve acontecer em janela sem escrita.
  await knex.raw(
    'CREATE UNIQUE INDEX IF NOT EXISTS "uk_users_email_ci" ON "users" (lower("email"))',
  );
  await knex.raw(
    'CREATE UNIQUE INDEX IF NOT EXISTS "uk_requesters_email_ci" ON "requesters" (lower("corporate_email"))',
  );

  // `NOT VALID` evita manter ACCESS EXCLUSIVE enquanto o banco varre as linhas
  // antigas; `VALIDATE` faz a varredura com SHARE UPDATE EXCLUSIVE.
  await knex.raw(`
    ALTER TABLE "mappings"
    ADD CONSTRAINT "ck_mappings_concluded_at"
    CHECK (("is_concluded" AND "concluded_at" IS NOT NULL)
        OR (NOT "is_concluded" AND "concluded_at" IS NULL))
    NOT VALID
  `);
  await knex.raw('ALTER TABLE "mappings" VALIDATE CONSTRAINT "ck_mappings_concluded_at"');

  await knex.raw(`
    CREATE INDEX IF NOT EXISTS "idx_audit_history_request_timeline"
    ON "audit_history" ("entity_type", "entity_id", "occurred_at" DESC, "audit_id" DESC)
  `);

  await knex.schema.alterTable("requests", (table) => {
    table.dropColumn("preliminary_complexity");
    table.dropColumn("screening_justification");
    table.dropColumn("identified_risks");
  });

  await knex.schema.alterTable("pending_items", (table) => {
    table.dropColumn("requested_fields");
    table.dropColumn("requires_attachment");
    table.dropColumn("expected_attachment_type");
    table.dropColumn("resolution");
    table.dropColumn("resolved_by");
    table.dropColumn("resolved_at");
  });

  await knex.raw('DROP INDEX IF EXISTS "idx_attachments_restricted"');
  await knex.schema.alterTable("attachments", (table) => {
    table.dropColumn("is_restricted");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.alterTable("attachments", (table) => {
    table.boolean("is_restricted").notNullable().defaultTo(false);
    table.index("is_restricted", "idx_attachments_restricted");
  });

  await knex.schema.alterTable("pending_items", (table) => {
    table.jsonb("requested_fields");
    table.boolean("requires_attachment").notNullable().defaultTo(false);
    table.string("expected_attachment_type", 100);
    table.text("resolution");
    table.string("resolved_by", 100);
    table.timestamp("resolved_at", { useTz: true });
  });

  await knex.schema.alterTable("requests", (table) => {
    table.string("preliminary_complexity", 50);
    table.text("screening_justification");
    table.text("identified_risks");
  });

  await knex.raw('DROP INDEX IF EXISTS "idx_audit_history_request_timeline"');
  await knex.raw('ALTER TABLE "mappings" DROP CONSTRAINT IF EXISTS "ck_mappings_concluded_at"');
  await knex.raw('DROP INDEX IF EXISTS "uk_requesters_email_ci"');
  await knex.raw('DROP INDEX IF EXISTS "uk_users_email_ci"');
}
