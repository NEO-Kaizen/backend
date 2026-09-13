export async function up(knex) {
  await knex.schema.alterTable("requesters", (table) => {
    table.dropIndex("corporate_email", "idx_requesters_email");
    table.unique(["corporate_email"], { indexName: "uk_requesters_email" });
  });
}

export async function down(knex) {
  await knex.schema.alterTable("requesters", (table) => {
    table.dropUnique(["corporate_email"], "uk_requesters_email");
    table.index("corporate_email", "idx_requesters_email");
  });
}
