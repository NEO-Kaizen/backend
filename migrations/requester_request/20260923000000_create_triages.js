/**
 * Histórico versionado de triagens (D-N14).
 *
 * Cada `POST /requests/:protocol/triage` insere uma row (append). O snapshot
 * é normalizado em colunas; proveniência (`occurred_at`/`actor`/`change_origin`)
 * vem do `audit_history` (`request.triage`, `new_value->>'triageId' = triage_id`).
 *
 * `GET /requests/:protocol/triage` passa a ler a última row (por `audit`),
 * e `GET /requests/:protocol/internal-notes` devolve `triages[]` completo.
 *
 * Sem backfill de `requests.internal_notes.__triage` (quebra limpa v2.0).
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable("triages", (table) => {
    table.uuid("triage_id").primary();
    table
      .bigInteger("request_id")
      .notNullable()
      .references("request_id")
      .inTable("requests")
      .onDelete("CASCADE");
    table.string("adherent_to_scope", 3).notNullable();
    table.text("adherent_justification").notNullable().defaultTo("");
    table.string("change_category", 3).notNullable();
    table.string("new_category", 40).notNullable().defaultTo("");
    table.text("preliminary_complexity").notNullable().defaultTo("");
    table.text("perceived_risks").notNullable().defaultTo("");
    table.string("suggested_responsible", 150).notNullable().defaultTo("");
    table.text("suggested_responsible_justification").notNullable().defaultTo("");
    table
      .integer("exit_status")
      .notNullable()
      .references("status_id")
      .inTable("statuses")
      .onDelete("RESTRICT");
    table.string("result", 1000).notNullable();
    table.text("conclusion_justification").notNullable();
    table.index(["request_id", "triage_id"], "idx_triages_request_triage");
  });

  await knex.raw(`
    ALTER TABLE triages
    ADD CONSTRAINT ck_triages_adherent_to_scope
    CHECK (adherent_to_scope IN ('Sim', 'Não', ''))
  `);
  await knex.raw(`
    ALTER TABLE triages
    ADD CONSTRAINT ck_triages_change_category
    CHECK (change_category IN ('Sim', 'Não', ''))
  `);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTable("triages");
}
