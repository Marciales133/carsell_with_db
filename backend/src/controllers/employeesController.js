import db from '../config/db.js';
import bcrypt from 'bcrypt';

// GET /api/employees
export const getAllEmployees = async (req, res) => {
    try {
        const employees = await db('employees')
        .select(
            'employees.*',
            'departments.name as department_name',
            'positions.title as position_title'
        )
        .leftJoin('departments', 'employees.department_id', 'departments.department_id')
        .leftJoin('positions', 'employees.position_id', 'positions.position_id')
        .orderBy('employees.name');
        res.json(employees);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/employees/:id
export const getEmployeeById = async (req, res) => {
    try {
        const employee = await db('employees')
        .where({ 'employees.employee_id': req.params.id })
        .leftJoin('departments', 'employees.department_id', 'departments.department_id')
        .leftJoin('positions', 'employees.position_id', 'positions.position_id')
        .select(
            'employees.*',
            'departments.name as department_name',
            'positions.title as position_title'
        )
        .first();
        if (!employee) return res.status(404).json({ error: 'Employee not found' });
        res.json(employee);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /api/employees  — mirrors your addEmployee() frontend logic
export const createEmployee = async (req, res) => {
    try {
        const {
        employee_code, track_number, name, age, gender, birth_date, civil_status,
        nationality, contact_number, emergency_contact, email_address, current_address,
        date_hired, employment_status, shift, work_location, employee_type,
        sss, tin, phil_health, pag_ibig, national_id, basic_salary, pay_type,
        payroll_channel, salary_level, allowances, deductions, status, separation_date,
        remarks, login_email, system_role, password, access_permissions,
        department_id, position_id, manager_id
        } = req.body;

        const password_hash = await bcrypt.hash(password, 10);

        const [newEmployee] = await db('employees')
        .insert({
            employee_code, track_number, name, age, gender, birth_date, civil_status,
            nationality, contact_number, emergency_contact, email_address, current_address,
            date_hired, employment_status, shift, work_location, employee_type,
            sss, tin, phil_health, pag_ibig, national_id, basic_salary, pay_type,
            payroll_channel, salary_level, allowances,
            deductions: deductions || 'None',
            status, separation_date, remarks,
            login_email, system_role, password_hash, access_permissions,
            department_id: department_id || null,
            position_id: position_id || null,
            manager_id: manager_id || null,
            clock_state: 'clockOut',
            time_rendered: 0
        })
        .returning('*');
        res.status(201).json(newEmployee);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// PUT /api/employees/:id  — mirrors your "Save" button in bindEmployeeButtons()
export const updateEmployee = async (req, res) => {
    try {
        const updates = { ...req.body };

        // If a new plain-text password was passed, hash it before saving
        if (updates.password) {
        updates.password_hash = await bcrypt.hash(updates.password, 10);
        delete updates.password;
        }

        const [updated] = await db('employees')
        .where({ employee_id: req.params.id })
        .update(updates)
        .returning('*');
        if (!updated) return res.status(404).json({ error: 'Employee not found' });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE /api/employees/:id
export const deleteEmployee = async (req, res) => {
    try {
        const deleted = await db('employees').where({ employee_id: req.params.id }).del();
        if (!deleted) return res.status(404).json({ error: 'Employee not found' });
        res.json({ message: 'Employee deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// PATCH /api/employees/:id/clock  — mirrors your clockIn/clockOut frontend logic
// body: { action: 'clockIn' | 'clockOut', manager_employee_id: 'EMP112', employee_id_input: 'EMP001' }
export const clockEmployee = async (req, res) => {
    try {
        const { action, employee_code_input, manager_employee_code } = req.body;

        // Find the target employee (from the URL param)
        const employee = await db('employees').where({ employee_id: req.params.id }).first();
        if (!employee) return res.status(404).json({ error: 'Employee not found' });

        // General Manager bypass: GM clocks themselves using their own managerId value
        const isGM = employee.manager_id === null || String(employee.manager_id) === String(employee.employee_id);
        if (!isGM) {
        // Verify the employee's own code
        if (employee.employee_code !== employee_code_input) {
            return res.status(401).json({ error: 'Invalid employee ID' });
        }
        // Verify the manager
        const manager = await db('employees').where({ employee_code: manager_employee_code }).first();
        if (!manager) return res.status(401).json({ error: 'Invalid manager ID' });
        if (manager.employee_id !== employee.manager_id) {
            return res.status(401).json({ error: 'Manager does not supervise this employee' });
        }
        }

        if (action === 'clockIn' && employee.clock_state === 'clockIn') {
        return res.status(400).json({ error: 'Already clocked in' });
        }
        if (action === 'clockOut' && employee.clock_state === 'clockOut') {
        return res.status(400).json({ error: 'Already clocked out' });
        }

        const [updated] = await db('employees')
        .where({ employee_id: req.params.id })
        .update({ clock_state: action })
        .returning(['employee_id', 'name', 'clock_state']);
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/employees/salesmen  — mirrors your AllSalesmanList() frontend logic
export const getSalesmen = async (req, res) => {
    try {
        const salesmen = await db('employees')
        .whereRaw("LOWER(employment_status) = 'active'")
        .andWhere({ system_role: 'Employee' })
        .select('employee_id', 'name', 'position_id', 'department_id');
        res.json(salesmen);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};