/** @param {import("knex").Knex} knex */
export async function up(knex) {
  await knex.schema.alterTable("requests", (table) => {
    table.timestamp("last_reopened_at", { useTz: true }).nullable();
  });
  await knex.schema.alterTable("audit_history", (table) => {
    table.jsonb("previous_meeting").nullable();
  });
}

/** @param {import("knex").Knex} knex */
export async function down(knex) {
  await knex.schema.alterTable("audit_history", (table) => {
    table.dropColumn("previous_meeting");
  });
  await knex.schema.alterTable("requests", (table) => {
    table.dropColumn("last_reopened_at");
  });
}
