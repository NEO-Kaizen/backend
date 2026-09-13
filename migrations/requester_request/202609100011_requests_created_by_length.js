export async function up(knex) {
  await knex.schema.alterTable("requests", (table) => {
    table.string("created_by", 254).notNullable().alter();
  });
}

export async function down(knex) {
  await knex.schema.alterTable("requests", (table) => {
    table.string("created_by", 100).notNullable().alter();
  });
}
