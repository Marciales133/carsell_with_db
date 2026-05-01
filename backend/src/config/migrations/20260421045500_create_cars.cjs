// CARS
exports.up = function (knex) {
    return knex.schema.createTable('cars', function (table) {
        table.increments('car_id').primary();
        table.string('type', 50).nullable();
        table.string('brand', 80).notNullable();
        table.string('model', 80).notNullable();
        table.integer('year').notNullable();
        table.string('color', 50).notNullable();
        table.integer('quantity').notNullable().defaultTo(0);
        table.decimal('price', 12, 2).notNullable();
        table.integer('in_stock').notNullable().defaultTo(0);
        table.integer('sold').notNullable().defaultTo(0);
        table.integer('reserved').notNullable().defaultTo(0);
        table.unique(['brand', 'model', 'year', 'color']);
    });
};
exports.down = function (knex) {
    return knex.schema.dropTable('cars');
};