/**
 * RF16 (issue #210) — janela de conclusão e data pública da conclusão.
 *
 * - `system_settings.duplicate_completed_window_months` (1..36, padrão 3)
 *   define por quanto tempo uma Solicitação concluída continua no corpus. O
 *   intervalo é fixo: o CHECK abaixo é a fonte no banco e o default 3 da
 *   leitura em `src/shared/types/systemSettings.ts` espelha este valor.
 * - `request_public_projections.public_concluded_at` guarda a conclusão
 *   efetiva usada na varredura da janela. É interno: não entra no DTO.
 * - Os índices parciais cobrem a leitura de publicadas, a supressão fora da
 *   janela e a reconciliação de suprimidas que voltaram para dentro dela.
 *
 * Regras em `docs/rules/duplicate-detection.md`; persistência em
 * `docs/database/duplicate-detection-persistence.md` e
 * `docs/database/system-settings-persistence.md`.
 */
export async function up(knex) {
  await knex.schema.alterTable("system_settings", (table) => {
    table.integer("duplicate_completed_window_months").notNullable().defaultTo(3);
  });
  await knex.raw(`
    ALTER TABLE system_settings
    ADD CONSTRAINT ck_system_settings_duplicate_completed_window_months
    CHECK (duplicate_completed_window_months BETWEEN 1 AND 36)
  `);

  await knex.schema.alterTable("request_public_projections", (table) => {
    table.timestamp("public_concluded_at", { useTz: true });
  });
  await knex.raw(`
    CREATE INDEX idx_request_public_projections_published_concluded
    ON request_public_projections (publication_status, is_publicly_listable, public_concluded_at)
    WHERE publication_status = 'published' AND is_publicly_listable = TRUE
  `);
  await knex.raw(`
    CREATE INDEX idx_request_public_projections_suppressed_outside_window
    ON request_public_projections (public_concluded_at)
    WHERE publication_status = 'suppressed' AND suppression_reason = 'outside_window'
  `);
}

export async function down(knex) {
  await knex.raw("DROP INDEX IF EXISTS idx_request_public_projections_suppressed_outside_window");
  await knex.raw("DROP INDEX IF EXISTS idx_request_public_projections_published_concluded");

  await knex.schema.alterTable("request_public_projections", (table) => {
    table.dropColumn("public_concluded_at");
  });

  await knex.raw(`
    ALTER TABLE system_settings
    DROP CONSTRAINT IF EXISTS ck_system_settings_duplicate_completed_window_months
  `);
  await knex.schema.alterTable("system_settings", (table) => {
    table.dropColumn("duplicate_completed_window_months");
  });
}
