/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.raw("CREATE SEQUENCE requests_protocol_seq START 1 INCREMENT 1");

  await knex.schema.createTable("requests", (table) => {
    table.increments("request_id");
    table.string("protocol", 20).notNullable().unique();

    table.string("requester_name", 150);
    table.string("requester_email", 254);
    table.string("requester_area", 100);
    table.string("requester_department", 100);
    table.string("requester_manager", 150);
    table.string("requester_additional_contact", 50);

    table.string("process", 150);
    table.string("title", 255);
    table.string("demand_type", 60);
    table.string("category", 60);
    table.text("description");
    table.text("problem");
    table.text("expected_result");
    table.text("justification");

    table.text("operational_description");
    table.text("operational_steps");
    table.string("systems", 255);
    table.string("frequency", 60);
    table.integer("volume");
    table.integer("people_involved");
    table.string("average_execution_time", 30);
    table.text("monthly_estimated_effort");
    table.boolean("manual_controls");
    table.text("risks");
    table.text("client_impact");
    table.text("operational_impact");
    table.date("desired_deadline");
    table.string("criticality", 30);

    table.boolean("has_documentation");
    table.text("similar_solution_exists");
    table.string("dependency_other_areas", 255);
    table.boolean("restricted_handling");
    table.text("notes");

    table.string("status", 60).notNullable().defaultTo("Recebida");
    table.string("priority", 60);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

    table.index(["requester_email"]);
    table.index(["status"]);
    table.index(["category"]);
  });

  await knex.schema.createTable("request_time_preferences", (table) => {
    table.increments("request_time_preference_id");
    table
      .integer("request_id")
      .notNullable()
      .references("request_id")
      .inTable("requests")
      .onDelete("CASCADE");
    table.string("slot", 5).notNullable();

    table.index(["request_id"]);
  });

  await knex.raw(
    "ALTER TABLE requests ALTER COLUMN protocol SET DEFAULT 'SOL-' || to_char(CURRENT_DATE, 'YYYY') || '-' || lpad(nextval('requests_protocol_seq')::text, 6, '0')",
  );
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTable("request_time_preferences");
  await knex.schema.dropTable("requests");
  await knex.raw("DROP SEQUENCE IF EXISTS requests_protocol_seq");
}