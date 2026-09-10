export async function up(knex) {
  await knex.schema.createTable("request_time_preferences", (table) => {
    table.increments("request_time_preference_id").primary();
    table
      .bigInteger("request_id")
      .notNullable()
      .references("request_id")
      .inTable("requests")
      .onDelete("CASCADE");
    table.timestamp("scheduled_for", { useTz: false }).notNullable();
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.unique(["request_id", "scheduled_for"], {
      indexName: "uk_request_time_preferences_slot",
    });
  });
}

export async function down(knex) {
  await knex.schema.dropTable("request_time_preferences");
}
