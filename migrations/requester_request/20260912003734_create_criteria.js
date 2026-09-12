export async function up(knex) {
  await knex.schema.createTable("criteria", (table) => {
    table.string("criterion_id", 50).primary();
    table.string("name", 100).notNullable();
    table.integer("weight").notNullable();
    table.boolean("active").notNullable().defaultTo(true);
    table.integer("display_order").notNullable();
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true });
  });
}
export async function down(knex) {
  await knex.schema.dropTable("criteria");
}
