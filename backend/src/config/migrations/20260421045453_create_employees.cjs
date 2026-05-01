//EMPLOYEES
exports.up = function (knex) {
    return knex.schema.createTable('employees', function (table) {
        table.increments('employee_id').primary();
        table.string('employee_code', 20).notNullable().unique();
        table.string('track_number', 10).notNullable().unique();
        table.string('name', 150).notNullable();
        table.integer('age').nullable();
        table.enu('gender', ['Male', 'Female']).nullable();
        table.date('birth_date').nullable();
        table.enu('civil_status', ['Single', 'Married']).nullable();
        table.string('nationality', 80).nullable();
        table.string('contact_number', 20).nullable();
        table.string('emergency_contact', 20).nullable();
        table.string('email_address', 150).nullable().unique();
        table.text('current_address').nullable();
        table.date('date_hired').nullable();
        table.string('employment_status', 50).nullable();
        table.string('shift', 50).nullable();
        table.string('work_location', 100).nullable();
        table.string('employee_type', 50).nullable();
        table.string('sss', 30).nullable();
        table.string('tin', 30).nullable();
        table.string('phil_health', 30).nullable();
        table.string('pag_ibig', 30).nullable();
        table.string('national_id', 30).nullable();
        table.decimal('basic_salary', 12, 2).nullable();
        table.string('pay_type', 30).nullable();
        table.string('payroll_channel', 50).nullable();
        table.string('salary_level', 30).nullable();
        table.string('allowances', 200).nullable();
        table.string('deductions', 200).nullable();
        table.string('status', 30).nullable();
        table.date('separation_date').nullable();
        table.text('remarks').nullable();
        table.string('login_email', 150).notNullable().unique();
        table.string('system_role', 30).nullable();
        table.string('password_hash', 255).notNullable();
        table.string('access_permissions', 100).nullable();
        table.enu('clock_state', ['clockIn', 'clockOut']).notNullable().defaultTo('clockOut');
        table.integer('time_rendered').notNullable().defaultTo(0);
        // FKs
        table.integer('department_id').unsigned().nullable()
            .references('department_id').inTable('departments').onDelete('SET NULL');
        table.integer('position_id').unsigned().nullable()
            .references('position_id').inTable('positions').onDelete('SET NULL');
        table.integer('manager_id').unsigned().nullable()
            .references('employee_id').inTable('employees').onDelete('SET NULL');
    });
};
exports.down = function (knex) {
    return knex.schema.dropTable('employees');
};
