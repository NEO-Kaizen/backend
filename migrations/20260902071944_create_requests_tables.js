/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
    return knex.schema.createTable("requests", (table) => {
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

        table.text("operational_steps");
        table.string("systems", 255);
        table.string("frequency", 60);
        table.integer("volume");
        table.integer("people_involved");
        table.string("average_execution_time", 30);
        table.boolean("manual_controls");
        table.text("risks");
        table.text("client_impact");
        table.date("desired_deadline");
        table.string("criticality", 30);

        table.boolean("has_documentation");
        table.string("dependency_other_areas", 255);
        table.boolean("restricted_handling");
        table.text("notes");

        table.string("status", 60).notNullable().defaultTo("Recebida");
        table.string("priority", 60);
        table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
        table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
    });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
    return knex.schema.dropTable("requests");
}