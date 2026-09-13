export async function up(knex) {
  await knex.schema.createTable("priorities", (table) => {
    table.increments("priority_id").primary();
    table.string("level", 50).notNullable().unique({ indexName: "uk_priorities_level" });
    table.integer("min_score").notNullable();
    table.integer("max_score").notNullable();
    table.decimal("default_weight", 3, 2).notNullable();
    table.string("color_code", 50);
    table.text("description");
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  await knex.schema.dropTable("priorities");
}
