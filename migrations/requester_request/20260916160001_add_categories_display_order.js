/**
 * Ordem de exibição e unicidade case-insensitive das categorias (contrato
 * `portal-config-api.md`, seção "categories"):
 *
 * - `display_order` — inteiro com a ordem do card (índice do array); backfill
 *   com a ordem atual (`category_id`), mantendo o comportamento existente;
 * - índice único em `LOWER(name)` — reforça no banco a unicidade
 *   case-insensitive exigida pelo PATCH (`zoname` já tem unicidade
 *   case-sensitive na `uk_categories_name`).
 */
export async function up(knex) {
  await knex.schema.alterTable("categories", (table) => {
    table.integer("display_order");
  });

  // Backfill: ordem atual = `category_id` (ordem de inserção dos 10 oficiais).
  await knex.raw(`
    UPDATE "categories" SET "display_order" = "category_id"
    WHERE "display_order" IS NULL
  `);

  // Único índice com LOWER: reforça a unicidade case-insensitive de `name`
  // (a unicidade exata já existe como uk_categories_name).
  await knex.raw(`
    CREATE UNIQUE INDEX "uk_categories_name_ci"
    ON "categories" (LOWER("name"))
  `);
}

export async function down(knex) {
  await knex.raw('DROP INDEX IF EXISTS "uk_categories_name_ci"');
  await knex.schema.alterTable("categories", (table) => {
    table.dropColumn("display_order");
  });
}
