exports.up = async function (knex) {
  await knex.schema.createTable('protocol_sequences', (table) => {
    table.integer('year').primary();
    table.string('prefix', 10).notNullable().defaultTo('MAAT');
    table.integer('last_number').notNullable().defaultTo(0);
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTable('protocol_sequences');
};