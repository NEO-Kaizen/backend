exports.up = async function (knex) {
  await knex.schema.createTable('pending_items', (table) => {
    table.uuid('pending_item_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('request_id').notNullable().references('request_id').inTable('requests').onDelete('CASCADE');
    table.enu('type', ['field_edit', 'attachment_upload', 'information', 'action'], { useNative: true, enumName: 'pending_item_type' }).notNullable();
    table.text('description').notNullable();
    table.jsonb('requested_fields');
    table.boolean('requires_attachment').notNullable().defaultTo(false);
    table.string('expected_attachment_type', 100);
    table.boolean('is_visible_to_requester').notNullable().defaultTo(true);
    table.enu('status', ['open', 'overdue', 'resolved'], { useNative: true, enumName: 'pending_item_status' }).notNullable().defaultTo('open');
    table.date('deadline');
    table.string('created_by', 100).notNullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.text('resolution');
    table.string('resolved_by', 100);
    table.timestamp('resolved_at', { useTz: true });
  });

  await knex.schema.alterTable('pending_items', (table) => {
    table.index('request_id', 'idx_pending_items_request');
    table.index('status', 'idx_pending_items_status');
    table.index('is_visible_to_requester', 'idx_pending_items_visibility');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTable('pending_items');
  await knex.raw('DROP TYPE IF EXISTS "pending_item_type"');
  await knex.raw('DROP TYPE IF EXISTS "pending_item_status"');
};