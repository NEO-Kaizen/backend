export async function up(knex) {
  await knex.schema.createTable("attachments", (table) => {
    table.uuid("attachment_id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table
      .uuid("request_id")
      .notNullable()
      .references("request_id")
      .inTable("requests")
      .onDelete("RESTRICT");
    table
      .uuid("pending_item_id")
      .nullable()
      .references("pending_item_id")
      .inTable("pending_items")
      .onDelete("SET NULL");
    table.string("file_name", 500).notNullable();
    table.string("file_path", 1000).notNullable();
    table.string("content_type", 100);
    table.bigInteger("size_bytes");
    table.boolean("is_restricted").notNullable().defaultTo(false);
    table.string("uploaded_by", 100);
    table.timestamp("uploaded_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.alterTable("attachments", (table) => {
    table.index("request_id", "idx_attachments_request");
    table.index("pending_item_id", "idx_attachments_pending_item");
    table.index("is_restricted", "idx_attachments_restricted");
    table.index("uploaded_at", "idx_attachments_uploaded_at");
  });
}

export async function down(knex) {
  await knex.schema.dropTable("attachments");
}
