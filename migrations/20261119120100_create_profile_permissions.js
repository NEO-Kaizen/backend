/**
 * Concessões de Permissão por Perfil: a composição chave + vínculo.
 *
 * Unicidade por Perfil + chave; o CHECK cobre só o domínio do vínculo — a
 * validade das chaves vive no catálogo em código (`src/shared/catalog/`), sem
 * cópia paralela em SQL.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable("profile_permissions", (table) => {
    table.increments("permission_id");
    table
      .integer("profile_id")
      .notNullable()
      .references("profile_id")
      .inTable("profiles")
      .onDelete("RESTRICT");
    table.string("permission_key", 60).notNullable();
    table.string("custody", 20).notNullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

    table.unique(["profile_id", "permission_key"], {
      indexName: "uk_profile_permissions_profile_key",
    });
    table.index("profile_id", "idx_profile_permissions_profile");
  });

  await knex.raw(`
    ALTER TABLE profile_permissions
    ADD CONSTRAINT ck_profile_permissions_custody
    CHECK (custody IN ('global', 'own', 'assigned', 'all'))
  `);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTable("profile_permissions");
}
