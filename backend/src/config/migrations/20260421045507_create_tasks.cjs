// TASKS
exports.up = function (knex) {
    return knex.schema.createTable('tasks', function (table) {
        table.increments('task_id').primary();
        table.string('description', 255).notNullable();
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    });
};
exports.down = function (knex) {
    return knex.schema.dropTable('tasks');
};