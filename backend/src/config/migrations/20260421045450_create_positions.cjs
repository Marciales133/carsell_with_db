// POSITION
exports.up = function (knex) {
    return knex.schema.createTable('positions', function (table) {
        table.increments('position_id').primary();
        table.string('title', 100).notNullable();
        table.integer('department_id').unsigned().notNullable()
        .references('department_id').inTable('departments').onDelete('CASCADE');
    });
};
exports.down = function (knex) {
    return knex.schema.dropTable('positions');
};
