/**
 * Observações internas imutáveis e checkpoint de visualização por usuário.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable("request_internal_notes", (table) => {
    table.bigIncrements("internal_note_id");
    table
      .bigInteger("request_id")
      .notNullable()
      .references("request_id")
      .inTable("requests")
      .onDelete("RESTRICT");
    table
      .integer("author_user_id")
      .notNullable()
      .references("user_id")
      .inTable("users")
      .onDelete("RESTRICT");
    table.string("author_role_at_creation", 30).notNullable();
    table.text("content").notNullable();
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.unique(["request_id", "internal_note_id"], {
      indexName: "uk_request_internal_notes_request_note",
    });
    table.index(
      ["request_id", "created_at", "internal_note_id"],
      "idx_request_internal_notes_timeline",
    );
    table.index("author_user_id", "idx_request_internal_notes_author");
  });

  await knex.raw(`
    ALTER TABLE request_internal_notes
    ADD CONSTRAINT ck_request_internal_notes_content
    CHECK (char_length(btrim(content)) BETWEEN 1 AND 4000)
  `);
  await knex.raw(`
    ALTER TABLE request_internal_notes
    ADD CONSTRAINT ck_request_internal_notes_author_role
    CHECK (author_role_at_creation IN ('Analista', 'Gestor', 'Administrador'))
  `);

  await knex.schema.createTable("request_internal_note_read_states", (table) => {
    table.bigInteger("request_id").notNullable();
    table
      .integer("user_id")
      .notNullable()
      .references("user_id")
      .inTable("users")
      .onDelete("RESTRICT");
    table.bigInteger("last_read_note_id").notNullable();
    table.timestamp("read_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.primary(["request_id", "user_id"], {
      constraintName: "pk_request_internal_note_read_states",
    });
    table
      .foreign(["request_id", "last_read_note_id"], "fk_internal_note_read_states_request_note")
      .references(["request_id", "internal_note_id"])
      .inTable("request_internal_notes")
      .onDelete("RESTRICT");
    table.index("last_read_note_id", "idx_internal_note_read_states_last_note");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTable("request_internal_note_read_states");
  await knex.schema.dropTable("request_internal_notes");
}
