/**
 * RF16 (issue #210) — data de conclusão da Solicitação.
 *
 * `requests.concluded_at` é gravado ao entrar no Status 16 e limpo ao sair,
 * em todas as vias que mudam o Status. A janela do corpus de duplicidade usa
 * essa data; `updated_at` nunca é fallback (ver backfill).
 *
 * Regras em `docs/rules/duplicate-detection.md`; persistência em
 * `docs/database/requests-persistence.md`.
 */
export async function up(knex) {
  await knex.schema.alterTable("requests", (table) => {
    table.timestamp("concluded_at", { useTz: true });
  });
}

export async function down(knex) {
  await knex.schema.alterTable("requests", (table) => {
    table.dropColumn("concluded_at");
  });
}
