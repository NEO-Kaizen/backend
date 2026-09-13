/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable("audit_history", (table) => {
    table.bigIncrements("audit_id");
    table.string("entity_type", 100).notNullable();
    table.string("entity_id", 100).notNullable();
    table.string("action_type", 100).notNullable();
    table.text("previous_value");
    table.text("new_value");
    table.integer("user_id").nullable().references("user_id").inTable("users").onDelete("SET NULL");
    table.timestamp("occurred_at").notNullable().defaultTo(knex.fn.now());
    table.text("note");
    table.string("change_origin", 50);
    table.boolean("is_immutable").notNullable().defaultTo(true);
  });

  await knex.schema.alterTable("audit_history", (table) => {
    table.index(["entity_type", "entity_id"], "idx_audit_history_entity");
    table.index("action_type", "idx_audit_history_action_type");
    table.index("occurred_at", "idx_audit_history_occurred_at");
    table.index("user_id", "idx_audit_history_user");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTable("audit_history");
}
