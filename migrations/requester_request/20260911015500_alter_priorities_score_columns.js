export async function up(knex) {
  await knex.schema.alterTable("priorities", (table) => {
    table.decimal("min_score", 4, 1).notNullable().alter();
    table.decimal("max_score", 4, 1).notNullable().alter();
  });
}
export async function down(knex) {
  await knex.schema.alterTable("priorities", (table) => {
    table.integer("min_score").notNullable().alter();
    table.integer("max_score").notNullable().alter();
  });
}
