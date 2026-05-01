// CLIENTS
exports.up = function (knex) {
    return knex.schema.createTable('clients', function (table) {
        table.increments('client_id').primary();
        table.string('name', 150).notNullable().unique();
        table.string('status', 30).nullable();
        table.string('client_type', 30).nullable();
        table.string('phone', 30).nullable();
        table.string('email', 150).nullable();
        table.date('date_registered').nullable();
        table.date('last_purchase_date').nullable();
        table.text('address').nullable();
        table.integer('number_of_purchases').notNullable().defaultTo(0);
    });
};
exports.down = function (knex) {
    return knex.schema.dropTable('clients');
};