export async function up(knex) {
  await knex.schema.alterTable("requests", (table) => {
    table.integer("priority_score").nullable();
  });

  // Escala 0-25, alinhada ao contrato do frontend (prioritization.maxScore
  // é fixo em 25 — docs/requests-internal-query-contract.md).
  await knex.raw(
    "ALTER TABLE requests ADD CONSTRAINT ck_requests_priority_score CHECK (priority_score IS NULL OR priority_score BETWEEN 0 AND 25)",
  );
}

export async function down(knex) {
  await knex.schema.alterTable("requests", (table) => {
    table.dropColumn("priority_score");
  });
}
