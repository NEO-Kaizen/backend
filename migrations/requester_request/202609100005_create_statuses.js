export async function up(knex) {
  await knex.schema.createTable("statuses", (table) => {
    table.increments("status_id").primary();
    table.integer("order_number").notNullable().unique({ indexName: "uk_statuses_order" });
    table.string("name", 100).notNullable().unique({ indexName: "uk_statuses_name" });
    table.text("description");
    table.boolean("is_final").notNullable().defaultTo(false);
  });

  await knex.schema.alterTable("statuses", (table) => {
    table.index("order_number", "idx_statuses_order");
  });
}

export async function down(knex) {
  await knex.schema.dropTable("statuses");
}
