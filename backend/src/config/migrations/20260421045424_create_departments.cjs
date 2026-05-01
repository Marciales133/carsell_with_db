// DEPARTMENT
exports.up = function (knex) {
    return knex.schema.createTable('departments', function (table) {
        table.increments('department_id').primary();
        table.string('name', 100).notNullable().unique();
    });
};
exports.down = function (knex) {
    return knex.schema.dropTable('departments');
};