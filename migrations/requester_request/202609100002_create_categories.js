exports.up = async function (knex) {
  await knex.schema.createTable('categories', (table) => {
    table.increments('category_id').primary();
    table.string('name', 100).notNullable().unique({ indexName: 'uk_categories_name' });
    table.text('description');
    table.enu('status', ['active', 'inactive'], { useNative: true, enumName: 'category_status' }).notNullable().defaultTo('active');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.alterTable('categories', (table) => {
    table.index('status', 'idx_categories_status');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTable('categories');
  await knex.raw('DROP TYPE IF EXISTS "category_status"');
};