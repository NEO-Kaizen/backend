export async function up(knex) {
  await knex.schema.alterTable("requests", (table) => {
    table.string("updated_by", 254).alter();
  });
  await knex.schema.alterTable("attachments", (table) => {
    table.string("uploaded_by", 254).alter();
  });
}

export async function down(knex) {
  await knex.schema.alterTable("requests", (table) => {
    table.string("updated_by", 100).alter();
  });
  await knex.schema.alterTable("attachments", (table) => {
    table.string("uploaded_by", 100).alter();
  });
}
