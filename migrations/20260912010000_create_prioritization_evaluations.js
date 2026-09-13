/**
 * Avaliação de priorização — estado atual por protocolo.
 *
 * Uma linha por solicitação (PK = protocol): guarda o snapshot das notas
 * (JSONB), o score normalizado (10..50 — RN-007, fonte: issue-51) e a
 * classificação (RN-008, lida das faixas da tabela `priorities`).
 *
 * O histórico de reavaliações NÃO tem tabela própria: é gravado no
 * `audit_history` (via `recordAudit`, entity_type = 'priorization'),
 * seguindo o princípio "estado atual na entidade, trilha imutável na auditoria".
 *
 * Colunas em inglês (padrão do projeto).
 */
export async function up(knex) {
  await knex.schema.createTable("prioritization_evaluations", (table) => {
    table.string("protocol", 25).primary();
    table.jsonb("notes").notNullable();
    table.decimal("score", 5, 1).notNullable();
    // Reusa o enum nativo `request_priority` já criado pela migration de
    // `requests` (D6). `specificType` evita que o knex tente `CREATE TYPE`
    // novamente (o `useNative` + `enumName` dispara `CREATE TYPE` e falharia).
    table.specificType("classification", "request_priority").notNullable();
    table.integer("calculated_by").notNullable();
    table.timestamp("calculated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true });

    // knex 3.x: check(predicate, bindings, constraintName) — 2º arg é o array
    // de bindings (undefined), 3º é o nome da constraint.
    table.check(
      "score >= 10 AND score <= 50",
      undefined,
      "ck_prioritization_evaluations_score_range",
    );
    table.check(
      "jsonb_typeof(notes) = 'object'",
      undefined,
      "ck_prioritization_evaluations_notes_object",
    );
    table.foreign("protocol").references("protocol").inTable("requests").onDelete("RESTRICT");
    table.foreign("calculated_by").references("user_id").inTable("users").onDelete("RESTRICT");
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists("prioritization_evaluations");
}
