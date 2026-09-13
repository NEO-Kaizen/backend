export async function up(knex) {
  await knex.schema.createTable("requesters", (table) => {
    table.uuid("requester_id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("full_name", 150).notNullable();
    table.string("corporate_email", 254).notNullable();
    table.string("area", 100).notNullable();
    table.string("department", 100);
    table.string("manager_name", 150).notNullable();
    table.string("additional_contact", 100);
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.alterTable("requesters", (table) => {
    table.index("corporate_email", "idx_requesters_email");
    table.index("area", "idx_requesters_area");
  });
}

export async function down(knex) {
  await knex.schema.dropTable("requesters");
}
