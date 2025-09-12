exports.up = function (knex) {
    return knex.schema.createTable('saved_ingredients', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.string('ingredient_name').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      
      // Prevent duplicate ingredients per user
      table.unique(['user_id', 'ingredient_name']);
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.dropTable('saved_ingredients');
  } 
