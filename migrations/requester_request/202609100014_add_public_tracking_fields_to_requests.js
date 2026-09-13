export async function up(knex) {
  await knex.schema.alterTable("requests", (table) => {
    table.text("last_technical_message");
    table.date("estimated_completion");
    table.timestamp("meeting_scheduled_for", { useTz: true });
    table.text("meeting_link");
  });
}

export async function down(knex) {
  await knex.schema.alterTable("requests", (table) => {
    table.dropColumn("last_technical_message");
    table.dropColumn("estimated_completion");
    table.dropColumn("meeting_scheduled_for");
    table.dropColumn("meeting_link");
  });
}
