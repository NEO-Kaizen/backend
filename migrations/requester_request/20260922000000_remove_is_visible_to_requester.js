/**
 * Remove is_visible_to_requester — toda pendência é para o solicitante (contract 03, opção 2).
 * @param {import("knex").Knex} knex
 */
export async function up(knex) {
  const hasColumn = await knex.schema.hasColumn("pending_items", "is_visible_to_requester");
  if (!hasColumn) return;

  // Drop index if exists (idx_pending_items_visibility)
  await knex.raw(`DROP INDEX IF EXISTS "idx_pending_items_visibility"`).catch(() => {});

  await knex.schema.alterTable("pending_items", (table) => {
    table.dropColumn("is_visible_to_requester");
  });
}

/**
 * @param {import("knex").Knex} knex
 */
export async function down(knex) {
  const hasColumn = await knex.schema.hasColumn("pending_items", "is_visible_to_requester");
  if (hasColumn) return;
  await knex.schema.alterTable("pending_items", (table) => {
    table
      .boolean("is_visible_to_requester")
      .notNullable()
      .defaultTo(true)
      .index("idx_pending_items_visibility");
  });
}
