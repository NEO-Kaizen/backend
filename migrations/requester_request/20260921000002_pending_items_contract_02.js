/**
 * Pendências por campo (issue #176, contrato docs/contract-pendencias_03.md):
 * migra pending_items para o ciclo requested → responded → validated, com
 * batchId e observação/campo.
 *
 * - Limpa seeds legados (enums antigos) antes de recriar os tipos nativos.
 * - Troca pending_item_type: field_edit|attachment_upload|information|action → field_edit|observation
 * - Troca pending_item_status: open|overdue|resolved → requested|responded|validated
 * - Adiciona colunas do contrato: batch_id, field_key/label, current/corrected_value,
 *   comment, response_text, responded_at/validated_at, request_attachment.
 *
 * @param {import("knex").Knex} knex
 */
export async function up(knex) {
  // Limpa dados legados que usam os enums antigos (attachments.pending_item_id fica NULL por SET NULL).
  await knex("pending_items").del();

  // --- Enums: type ---
  await knex.raw(`ALTER TABLE "pending_items" ALTER COLUMN "type" DROP DEFAULT`);
  await knex.raw(`ALTER TABLE "pending_items" ALTER COLUMN "type" TYPE text USING "type"::text`);
  await knex.raw(`DROP TYPE IF EXISTS "pending_item_type"`);
  await knex.raw(`CREATE TYPE "pending_item_type" AS ENUM('field_edit', 'observation')`);
  await knex.raw(
    `ALTER TABLE "pending_items" ALTER COLUMN "type" TYPE "pending_item_type" USING 'field_edit'::pending_item_type`,
  );

  // --- Enums: status ---
  await knex.raw(`ALTER TABLE "pending_items" ALTER COLUMN "status" DROP DEFAULT`);
  await knex.raw(
    `ALTER TABLE "pending_items" ALTER COLUMN "status" TYPE text USING "status"::text`,
  );
  await knex.raw(`DROP TYPE IF EXISTS "pending_item_status"`);
  await knex.raw(
    `CREATE TYPE "pending_item_status" AS ENUM('requested', 'responded', 'validated')`,
  );
  await knex.raw(
    `ALTER TABLE "pending_items" ALTER COLUMN "status" TYPE "pending_item_status" USING 'requested'::pending_item_status`,
  );
  await knex.raw(`ALTER TABLE "pending_items" ALTER COLUMN "status" SET DEFAULT 'requested'`);

  // --- Colunas novas do contrato ---
  const hasBatchId = await knex.schema.hasColumn("pending_items", "batch_id");
  const hasFieldKey = await knex.schema.hasColumn("pending_items", "field_key");
  const hasFieldLabel = await knex.schema.hasColumn("pending_items", "field_label");
  const hasCurrentValue = await knex.schema.hasColumn("pending_items", "current_value");
  const hasComment = await knex.schema.hasColumn("pending_items", "comment");
  const hasCorrectedValue = await knex.schema.hasColumn("pending_items", "corrected_value");
  const hasResponseText = await knex.schema.hasColumn("pending_items", "response_text");
  const hasRespondedAt = await knex.schema.hasColumn("pending_items", "responded_at");
  const hasValidatedAt = await knex.schema.hasColumn("pending_items", "validated_at");
  const hasRequestAttachment = await knex.schema.hasColumn("pending_items", "request_attachment");

  await knex.schema.alterTable("pending_items", (table) => {
    if (!hasBatchId) {
      table
        .uuid("batch_id")
        .notNullable()
        .defaultTo(knex.raw("gen_random_uuid()"))
        .index("idx_pending_items_batch");
    }
    if (!hasFieldKey) table.string("field_key", 100).nullable();
    if (!hasFieldLabel) table.string("field_label", 255).nullable();
    if (!hasCurrentValue) table.jsonb("current_value").nullable();
    if (!hasComment) table.text("comment").nullable();
    if (!hasCorrectedValue) table.jsonb("corrected_value").nullable();
    if (!hasResponseText) table.text("response_text").nullable();
    if (!hasRespondedAt) table.timestamp("responded_at", { useTz: true }).nullable();
    if (!hasValidatedAt) table.timestamp("validated_at", { useTz: true }).nullable();
    if (!hasRequestAttachment) table.boolean("request_attachment").notNullable().defaultTo(false);
  });

  // Backfill comment a partir de description para linhas remanescentes (tabela vazia após del, mas seguro).
  await knex.raw(
    `UPDATE "pending_items" SET "comment" = COALESCE("comment", "description") WHERE "comment" IS NULL`,
  );
  // Torna comment NOT NULL após backfill (se ainda nullable).
  await knex.raw(`ALTER TABLE "pending_items" ALTER COLUMN "comment" SET NOT NULL`);

  // Índice adicional para consultas por status/batch usado pelo review e internal.
  const hasIdxRequestStatus = await knex.raw(
    `SELECT 1 FROM pg_indexes WHERE indexname = 'idx_pending_items_request_status'`,
  );
  if (hasIdxRequestStatus.rows.length === 0) {
    await knex.schema.alterTable("pending_items", (table) => {
      table.index(["request_id", "status"], "idx_pending_items_request_status");
    });
  }
}

/**
 * @param {import("knex").Knex} knex
 */
export async function down(knex) {
  // Remove colunas novas
  await knex.schema
    .alterTable("pending_items", (table) => {
      table.dropIndex(["request_id", "status"], "idx_pending_items_request_status");
    })
    .catch(() => {});

  const cols = [
    "batch_id",
    "field_key",
    "field_label",
    "current_value",
    "comment",
    "corrected_value",
    "response_text",
    "responded_at",
    "validated_at",
    "request_attachment",
  ];
  for (const col of cols) {
    const exists = await knex.schema.hasColumn("pending_items", col);
    if (exists) {
      await knex.schema.alterTable("pending_items", (table) => table.dropColumn(col));
    }
  }

  // Restaura enums legados (tabela vazia)
  await knex("pending_items").del();
  await knex.raw(`ALTER TABLE "pending_items" ALTER COLUMN "type" DROP DEFAULT`);
  await knex.raw(`ALTER TABLE "pending_items" ALTER COLUMN "type" TYPE text USING "type"::text`);
  await knex.raw(`DROP TYPE IF EXISTS "pending_item_type"`);
  await knex.raw(
    `CREATE TYPE "pending_item_type" AS ENUM('field_edit', 'attachment_upload', 'information', 'action')`,
  );
  await knex.raw(
    `ALTER TABLE "pending_items" ALTER COLUMN "type" TYPE "pending_item_type" USING 'field_edit'::pending_item_type`,
  );
  await knex.raw(`ALTER TABLE "pending_items" ALTER COLUMN "status" DROP DEFAULT`);
  await knex.raw(
    `ALTER TABLE "pending_items" ALTER COLUMN "status" TYPE text USING "status"::text`,
  );
  await knex.raw(`DROP TYPE IF EXISTS "pending_item_status"`);
  await knex.raw(`CREATE TYPE "pending_item_status" AS ENUM('open', 'overdue', 'resolved')`);
  await knex.raw(
    `ALTER TABLE "pending_items" ALTER COLUMN "status" TYPE "pending_item_status" USING 'open'::pending_item_status`,
  );
  await knex.raw(`ALTER TABLE "pending_items" ALTER COLUMN "status" SET DEFAULT 'open'`);
}
