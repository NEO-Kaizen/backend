export async function up(knex) {
  await knex.raw("CREATE SEQUENCE requests_request_seq START 1 INCREMENT 1");

  await knex.schema.createTable("requests", (table) => {
    table.bigInteger("request_id").primary().defaultTo(knex.raw("nextval('requests_request_seq')"));
    table.string("protocol", 25).notNullable().unique({ indexName: "uk_requests_protocol" });
    table
      .uuid("requester_id")
      .notNullable()
      .references("requester_id")
      .inTable("requesters")
      .onDelete("RESTRICT");

    table.string("title", 150).notNullable();
    table.string("request_type", 80).notNullable();
    table.string("process_name", 150).notNullable();
    table.string("need_description", 4000).notNullable();
    table.string("problem_opportunity", 4000).notNullable();
    table.string("expected_result", 4000).notNullable();
    table.string("justification", 4000).notNullable();

    table.string("process_description", 4000).notNullable();
    table.string("process_steps", 4000).notNullable();
    table.string("systems_used", 255).notNullable();
    table.string("execution_frequency", 50).notNullable();
    table.string("approximate_volume", 100).notNullable();
    table.integer("people_involved").notNullable();
    table.string("average_duration", 60).notNullable();
    table.decimal("estimated_monthly_effort", 10, 2).notNullable();
    table.boolean("has_manual_controls").notNullable();
    table.string("manual_controls_detail", 1000);
    table.string("main_risks", 2000).notNullable();
    table.string("client_impact", 2000).notNullable();
    table
      .enu("operational_impact", ["Baixo", "Médio", "Alto", "Crítico"], {
        useNative: true,
        enumName: "operational_impact_level",
      })
      .notNullable();
    table.date("desired_deadline").notNullable();
    table
      .enu("perceived_criticality", ["Baixa", "Média", "Alta", "Crítica"], {
        useNative: true,
        enumName: "request_priority",
      })
      .notNullable();

    table.boolean("has_process_documentation");
    table.string("process_documentation_detail", 1000);
    table.boolean("has_similar_solution");
    table.string("similar_solution_detail", 1000);
    table.boolean("depends_on_other_areas");
    table.string("other_areas_detail", 1000);
    table.boolean("handles_restricted_info");
    table.string("restricted_info_detail", 1000);
    table.string("additional_notes", 2000);

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
  });

  await knex.raw(
    "ALTER TABLE requests ADD CONSTRAINT ck_requests_people_involved CHECK (people_involved > 0)",
  );
  await knex.raw(
    "ALTER TABLE requests ADD CONSTRAINT ck_requests_estimated_monthly_effort CHECK (estimated_monthly_effort >= 0)",
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
  await knex.schema.dropTable("requests");
  await knex.raw('DROP TYPE IF EXISTS "operational_impact_level"');
  await knex.raw('DROP TYPE IF EXISTS "request_priority"');
  await knex.raw("DROP SEQUENCE IF EXISTS requests_request_seq");
}
