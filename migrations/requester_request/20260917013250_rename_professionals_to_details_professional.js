export async function up(knex) {
  await knex.schema.renameTable("professionals", "details_professional");

  await knex.schema.alterTable("details_professional", (table) => {
    table.dropIndex("email", "idx_professionals_email");
    table.dropColumns("full_name", "email", "created_at");
    table.renameColumn("role", "job_title");

    table
      .integer("user_id")
      .notNullable()
      .unique({ indexName: "uk_details_professional_user" })
      .references("user_id")
      .inTable("users")
      .onDelete("RESTRICT");
  });

  await knex.raw("ALTER INDEX idx_professionals_status RENAME TO idx_details_professional_status");
}

export async function down(knex) {
  await knex.raw("ALTER INDEX idx_details_professional_status RENAME TO idx_professionals_status");

  await knex.schema.alterTable("details_professional", (table) => {
    table.dropUnique(["user_id"], "uk_details_professional_user");
    table.dropColumn("user_id");
    table.renameColumn("job_title", "role");
    // nullable: o dado original foi descartado no up()
    table.string("full_name", 255);
    table.string("email", 255);
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.index("email", "idx_professionals_email");
  });

  await knex.schema.renameTable("details_professional", "professionals");
}
