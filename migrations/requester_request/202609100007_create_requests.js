export async function up(knex) {
  await knex.schema.createTable("requests", (table) => {
    table.uuid("request_id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.string("protocol", 25).notNullable().unique({ indexName: "uk_requests_protocol" });
    table
      .uuid("requester_id")
      .notNullable()
      .references("requester_id")
      .inTable("requesters")
      .onDelete("RESTRICT");

    table.string("process_name", 255);
    table.string("title", 255).notNullable();
    table.string("request_type", 100);
    table.text("need_description").notNullable();
    table.text("problem_opportunity");
    table.text("expected_result");
    table.text("justification");

    table.text("current_process_description");
    table.text("process_steps");
    table.text("systems_used");
    table.string("execution_frequency", 100);
    table.string("approximate_volume", 100);
    table.integer("people_involved");
    table.string("average_duration", 100);
    table.string("estimated_monthly_effort", 100);
    table.boolean("has_manual_controls");
    table.text("main_risks");
    table.text("operational_impact");
    table.integer("client_impact");
    table.date("desired_deadline");
    table.string("perceived_criticality", 50);

    table.boolean("has_documentation");
    table.text("similar_solution");
    table.text("cross_area_dependencies");
    table.boolean("has_restricted_info");
    table.text("additional_notes");

    table
      .integer("category_id")
      .notNullable()
      .references("category_id")
      .inTable("categories")
      .onDelete("RESTRICT");
    table
      .integer("status_id")
      .notNullable()
      .references("status_id")
      .inTable("statuses")
      .onDelete("RESTRICT");
    table
      .integer("priority_id")
      .nullable()
      .references("priority_id")
      .inTable("priorities")
      .onDelete("RESTRICT");

    table.string("preliminary_complexity", 50);
    table.string("screening_result", 50);
    table.text("screening_justification");
    table.text("identified_risks");

    table
      .uuid("professional_id")
      .nullable()
      .references("professional_id")
      .inTable("professionals")
      .onDelete("SET NULL");

    table.text("internal_notes");
    table.text("next_steps");

    table.string("created_by", 100).notNullable();
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.string("updated_by", 100);
    table.timestamp("updated_at", { useTz: true });
    table.timestamp("last_external_update_at", { useTz: true });
    table.boolean("is_restricted_info").notNullable().defaultTo(false);
  });

  await knex.raw(
    "ALTER TABLE requests ADD CONSTRAINT ck_requests_client_impact CHECK (client_impact IS NULL OR client_impact BETWEEN 1 AND 5)",
  );

  await knex.schema.alterTable("requests", (table) => {
    table.index("created_at", "idx_requests_created_at");
    table.index("status_id", "idx_requests_status");
    table.index("category_id", "idx_requests_category");
    table.index("priority_id", "idx_requests_priority");
    table.index("professional_id", "idx_requests_professional");
    table.index("requester_id", "idx_requests_requester");
  });
}

export async function down(knex) {
  await knex.raw("ALTER TABLE requests DROP CONSTRAINT IF EXISTS ck_requests_client_impact");
  await knex.schema.dropTable("requests");
}
