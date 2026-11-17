/**
 * Revisão do banco (issue #130) — melhorias não destrutivas.
 *
 * 1. Índices para FKs que o PostgreSQL não indexa automaticamente.
 * 2. Invariantes que hoje existem apenas na aplicação:
 *    - no máximo um mapeamento aberto por solicitação;
 *    - participante de mapeamento é interno (`user_id`) ou externo (`name`+`email`).
 * 3. `audit_history.occurred_at` de `timestamp` para `timestamptz` — a aplicação
 *    serializa o valor com `toISOString()`, então o tipo sem timezone pode
 *    deslocar o instante conforme a timezone do processo.
 *
 * Nenhuma coluna é removida nesta migration.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

const FK_INDEXES = [
  { table: "users", column: "profile_id", index: "idx_users_profile" },
  {
    table: "prioritization_evaluations",
    column: "calculated_by",
    index: "idx_prioritization_evaluations_calculated_by",
  },
  {
    table: "request_internal_note_read_states",
    column: "user_id",
    index: "idx_internal_note_read_states_user",
  },
  { table: "requests", column: "last_public_status_id", index: "idx_requests_last_public_status" },
  { table: "mappings", column: "professional_id", index: "idx_mappings_professional" },
  { table: "mappings", column: "target_status_id", index: "idx_mappings_target_status" },
  { table: "mapping_participants", column: "user_id", index: "idx_mapping_participants_user" },
  { table: "triages", column: "exit_status", index: "idx_triages_exit_status" },
  { table: "triages", column: "assignee_user_id", index: "idx_triages_assignee_user" },
];

export async function up(knex) {
  for (const { table, column, index } of FK_INDEXES) {
    await knex.raw(`CREATE INDEX IF NOT EXISTS "${index}" ON "${table}" ("${column}")`);
  }

  // Invariante da aplicação (`create_mappings.js`): uma solicitação tem no
  // máximo um mapeamento aberto. Se houver dados legados violando a regra, a
  // migration falha de propósito — conclua/remova os duplicados antes.
  await knex.raw(`
    CREATE UNIQUE INDEX IF NOT EXISTS "uk_mappings_one_open_per_request"
    ON "mappings" ("request_id")
    WHERE "is_concluded" = false
  `);

  await knex.raw(`
    ALTER TABLE "mapping_participants"
    ADD CONSTRAINT "ck_mapping_participants_internal_or_external"
    CHECK ("user_id" IS NOT NULL OR ("name" IS NOT NULL AND "email" IS NOT NULL))
  `);

  // O valor foi gravado a partir de `now()` convertido para `timestamp`; usar a
  // timezone da sessão na conversão reconstrói o instante original.
  await knex.raw(`
    ALTER TABLE "audit_history"
    ALTER COLUMN "occurred_at" TYPE timestamptz
    USING "occurred_at" AT TIME ZONE current_setting('TimeZone')
  `);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.raw(`
    ALTER TABLE "audit_history"
    ALTER COLUMN "occurred_at" TYPE timestamp
    USING "occurred_at" AT TIME ZONE current_setting('TimeZone')
  `);

  await knex.raw(`
    ALTER TABLE "mapping_participants"
    DROP CONSTRAINT IF EXISTS "ck_mapping_participants_internal_or_external"
  `);

  await knex.raw('DROP INDEX IF EXISTS "uk_mappings_one_open_per_request"');

  for (const { index } of FK_INDEXES) {
    await knex.raw(`DROP INDEX IF EXISTS "${index}"`);
  }
}
