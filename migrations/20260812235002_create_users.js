/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable("users", (table) => {
    table.increments("user_id");
    table.string("full_name", 150).notNullable();
    table.string("email", 254).notNullable().unique();
    table.string("password_hash", 255).notNullable();

    table
      .integer("profile_id")
      .notNullable()
      .references("profile_id")
      .inTable("profiles")
      .onDelete("RESTRICT");

    table.boolean("is_active").notNullable().defaultTo(true);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTable("users");
}
