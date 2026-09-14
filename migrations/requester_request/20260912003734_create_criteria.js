export async function up(knex) {
  await knex.schema.createTable("criteria", (table) => {
    table.string("criterion_id", 50).primary();
    table.string("name", 100).notNullable();
    table.integer("weight").notNullable();
    table.boolean("active").notNullable().defaultTo(true);
    table.integer("display_order").notNullable();
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true });
    // knex 3.x: check(predicate, bindings, constraintName) — 2º arg é o array
    // de bindings (undefined), 3º é o nome da constraint.
    table.check("weight > 0", undefined, "ck_criteria_weight_positive");
  });
}
export async function down(knex) {
  await knex.schema.dropTable("criteria");
}
