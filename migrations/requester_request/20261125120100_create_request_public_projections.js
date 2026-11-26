/**
 * RF16 (issue #209) — projeção pública para a detecção de duplicidade.
 *
 * `request_public_projections` é a ÚNICA fonte de leitura da busca pública.
 * Ela guarda apenas campos curados, com `public_id` aleatório independente do
 * protocolo; a base interna (`requests`) nunca é consultada pelo endpoint.
 *
 * Regras e decisões:
 * - docs/rules/duplicate-detection.md
 * - docs/database/duplicate-detection-persistence.md
 * - docs/adr/0005-projecao-publica-para-deteccao-de-duplicidade.md
 */
const PUBLICATION_STATUS = ["published", "suppressed"];

export async function up(knex) {
  await knex.raw(
    `CREATE TYPE "request_publication_status" AS ENUM (${PUBLICATION_STATUS.map((status) => `'${status}'`).join(", ")})`,
  );

  await knex.schema.createTable("request_public_projections", (table) => {
    table
      .bigInteger("request_id")
      .primary()
      .references("request_id")
      .inTable("requests")
      .onDelete("CASCADE");

    // UUID gerado na aplicação (`randomUUID()`), nunca derivado do protocolo.
    table.uuid("public_id").notNullable().unique("uk_request_public_projections_public_id");

    table.string("public_title", 200).notNullable();
    table.text("public_summary").notNullable();
    table.string("public_category", 80).notNullable();
    table.string("public_status", 100).notNullable();
    table.string("public_period", 7).notNullable();

    table
      .enu("publication_status", PUBLICATION_STATUS, {
        useNative: true,
        existingType: true,
        enumName: "request_publication_status",
      })
      .notNullable();

    // Snapshot da allowlist Categoria + Status no momento da publicação.
    table.boolean("is_publicly_listable").notNullable();

    table.string("redaction_version", 30).notNullable();
    table.integer("version").notNullable().defaultTo(1);
    table.timestamp("published_at", { useTz: true });
    table.timestamp("suppressed_at", { useTz: true });
    table.string("suppression_reason", 40);
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(
      ["publication_status", "is_publicly_listable"],
      "idx_request_public_projections_publication",
    );
    table.index("updated_at", "idx_request_public_projections_updated_at");
  });
}

export async function down(knex) {
  await knex.schema.dropTable("request_public_projections");
  await knex.raw('DROP TYPE IF EXISTS "request_publication_status"');
}
