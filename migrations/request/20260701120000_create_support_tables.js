exports.up = function up(knex) {
  return knex.schema
    .createTable('requester', (table) => {
      table.uuid('id').notNullable().primary()
      table.string('full_name', 255).notNullable()
      table.string('corporate_email', 255).notNullable()
      table.string('area', 100)
      table.string('department', 100)
      table.string('manager_name', 255)
      table.string('additional_contact', 255)
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
    })
    .createTable('category', (table) => {
      table.increments('id').primary()
      table.string('name', 100).notNullable().unique()
      table.text('description')
      table.string('status', 10).notNullable().defaultTo('active')
      table.check("status IN ('active', 'inactive')")
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
    })
    .createTable('priority', (table) => {
      table.increments('id').primary()
      table.string('level', 50).notNullable().unique()
      table.integer('min_score').notNullable()
      table.integer('max_score').notNullable()
      table.decimal('default_weight', 3, 2)
      table.string('identification_color', 50)
      table.text('description')
      table.check('min_score <= max_score')
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
    })
    .createTable('status', (table) => {
      table.integer('id').notNullable().primary()
      table.integer('sort_order').notNullable().unique()
      table.string('name', 100).notNullable().unique()
      table.text('description')
      table.boolean('is_final_status').notNullable().defaultTo(false)
    })
    .createTable('assignee', (table) => {
      table.uuid('id').notNullable().primary()
      table.string('full_name', 255).notNullable()
      table.string('email', 255)
      table.string('role', 100)
      table.text('specialties')
      table.text('served_categories')
      table.string('status', 10).notNullable().defaultTo('active')
      table.check("status IN ('active', 'inactive')")
      table.integer('service_capacity').notNullable().defaultTo(5)
      table.check('service_capacity BETWEEN 1 AND 10')
      table.text('notes')
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
    })
}

exports.down = function down(knex) {
  return knex.schema
    .dropTableIfExists('assignee')
    .dropTableIfExists('status')
    .dropTableIfExists('priority')
    .dropTableIfExists('category')
    .dropTableIfExists('requester')
}