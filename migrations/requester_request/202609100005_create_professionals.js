export async function up(knex) {
  await knex.schema.createTable("professionals", (table) => {
    table.uuid("professional_id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("full_name", 255).notNullable();
    table.string("email", 255).notNullable();
    table.string("role", 100);
    table.text("specialties");
    table.text("attended_category_ids");
    table
      .enu("status", ["active", "inactive"], { useNative: true, enumName: "professional_status" })
      .notNullable()
      .defaultTo("active");
    table.integer("capacity").notNullable().defaultTo(5);
    table.text("notes");
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.alterTable("professionals", (table) => {
    table.index("status", "idx_professionals_status");
    table.index("email", "idx_professionals_email");
  });
}

export async function down(knex) {
  await knex.schema.dropTable("professionals");
  await knex.raw('DROP TYPE IF EXISTS "professional_status"');
}
