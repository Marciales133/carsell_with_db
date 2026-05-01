// SALES
exports.up = function (knex) {
    return knex.schema.createTable('sales', function (table) {
        table.increments('sale_id').primary();
        table.date('sale_date').notNullable();
        table.decimal('profit', 12, 2).nullable();
        table.enu('status', ['Completed', 'In-Progress', 'Canceled']).notNullable();
        table.integer('client_id').unsigned().notNullable()
        .references('client_id').inTable('clients').onDelete('CASCADE');
        table.integer('employee_id').unsigned().notNullable()
        .references('employee_id').inTable('employees').onDelete('CASCADE');
        table.integer('car_id').unsigned().notNullable()
        .references('car_id').inTable('cars').onDelete('CASCADE');
    });
};
exports.down = function (knex) {
    return knex.schema.dropTable('sales');
};