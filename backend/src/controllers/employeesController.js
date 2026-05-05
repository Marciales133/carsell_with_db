import db from '../config/db.js';
import bcrypt from 'bcrypt';

// ============================================================
// GET /api/employees
// ============================================================
export const getAllEmployees = async (req, res) => {
    try {
        const employees = await db('employees')
            .select(
                'employees.*',
                'departments.name as department_name',
                'positions.title as position_title'
            )
            .leftJoin('departments', 'employees.department_id', 'departments.department_id')
            .leftJoin('positions',   'employees.position_id',   'positions.position_id')
            .orderBy('employees.name');
        res.json(employees);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// ============================================================
// GET /api/employees/:id
// ============================================================
export const getEmployeeById = async (req, res) => {
    try {
        const employee = await db('employees')
            .where({ 'employees.employee_id': req.params.id })
            .leftJoin('departments', 'employees.department_id', 'departments.department_id')
            .leftJoin('positions',   'employees.position_id',   'positions.position_id')
            .select(
                'employees.*',
                'departments.name as department_name',
                'positions.title as position_title'
            )
            .first();
        if (!employee) return res.status(404).json({ error: 'Employee not found' });
        res.json(employee);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// ============================================================
// POST /api/employees
// ============================================================
export const createEmployee = async (req, res) => {
    try {
        const {
            employee_code, track_number, name, age, gender,
            birth_date, civil_status, nationality, contact_number,
            emergency_contact, email_address, current_address,
            date_hired, employment_status, shift, work_location, employee_type,
            sss, tin, phil_health, pag_ibig, national_id,
            basic_salary, pay_type, payroll_channel, salary_level,
            allowances, deductions, status, separation_date,
            remarks, login_email, system_role, password, access_permissions,
            department_name, position_title, manager_name
        } = req.body;

        const password_hash = await bcrypt.hash(password, 10);

        // 1. Resolve / auto-create department
        let departmentId = null;
        if (department_name) {
            let dept = await db('departments').where({ name: department_name }).first();
            if (!dept) {
                [dept] = await db('departments').insert({ name: department_name }).returning('*');
            }
            departmentId = dept.department_id;
        }

        // 2. Resolve / auto-create position (requires departmentId)
        let positionId = null;
        if (position_title && departmentId) {
            let pos = await db('positions')
                .where({ title: position_title, department_id: departmentId })
                .first();
            if (!pos) {
                [pos] = await db('positions')
                    .insert({ title: position_title, department_id: departmentId })
                    .returning('*');
            }
            positionId = pos.position_id;
        }

        // 3. Resolve manager
        let managerId = null;
        if (manager_name) {
            const mgr = await db('employees').where({ name: manager_name }).first();
            managerId = mgr?.employee_id || null;
        }

        // 4. Sanitize dates
        const safeBirthDate   = birth_date    && birth_date    !== 'N/A' ? birth_date    : null;
        const safeDateHired   = date_hired    && date_hired    !== 'N/A' ? date_hired    : null;
        const safeSepDate     = separation_date && separation_date !== 'N/A' ? separation_date : null;

        const [newEmployee] = await db('employees')
            .insert({
                employee_code, track_number, name,
                age:              age    || null,
                gender,
                birth_date:       safeBirthDate,
                civil_status,     nationality,
                contact_number,   emergency_contact,
                email_address,    current_address,
                date_hired:       safeDateHired,
                employment_status, shift, work_location, employee_type,
                sss, tin, phil_health, pag_ibig, national_id,
                basic_salary:     basic_salary || null,
                pay_type,         payroll_channel, salary_level, allowances,
                deductions:       deductions || 'None',
                status,
                separation_date:  safeSepDate,
                remarks,          login_email, system_role,
                password_hash,    access_permissions,
                department_id:    departmentId,
                position_id:      positionId,
                manager_id:       managerId,
                clock_state:      'clockOut',
                time_rendered:    0
            })
            .returning('*');

        res.status(201).json(newEmployee);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// ============================================================
// PUT /api/employees/:id  — full update, all fields
// ============================================================
export const updateEmployee = async (req, res) => {
    try {
        const updates = { ...req.body };

        // Hash password if a new one was provided
        if (updates.password) {
            updates.password_hash = await bcrypt.hash(updates.password, 10);
            delete updates.password;
        }

        // Sanitize date fields
        ['birth_date', 'date_hired', 'separation_date'].forEach(field => {
            if (!updates[field] || updates[field] === 'N/A' || String(updates[field]).trim() === '') {
                updates[field] = null;
            }
        });

        // Resolve manager_id from manager_name
        if ('manager_name' in updates) {
            if (updates.manager_name) {
                const mgr = await db('employees').where({ name: updates.manager_name }).first();
                updates.manager_id = mgr?.employee_id || null;
            } else {
                updates.manager_id = null;
            }
            delete updates.manager_name;
        }

        // Resolve department_id from department_name
        let resolvedDeptId = null;
        if ('department_name' in updates) {
            if (updates.department_name) {
                let dept = await db('departments').where({ name: updates.department_name }).first();
                if (!dept) {
                    [dept] = await db('departments')
                        .insert({ name: updates.department_name })
                        .returning('*');
                }
                resolvedDeptId         = dept.department_id;
                updates.department_id  = resolvedDeptId;
            } else {
                updates.department_id = null;
            }
            delete updates.department_name;
        }

        // Resolve position_id from position_title (needs department_id)
        if ('position_title' in updates) {
            if (updates.position_title) {
                const deptIdForPos = resolvedDeptId || updates.department_id;
                let pos = deptIdForPos
                    ? await db('positions')
                        .where({ title: updates.position_title, department_id: deptIdForPos })
                        .first()
                    : await db('positions')
                        .where({ title: updates.position_title })
                        .first();
                if (!pos && deptIdForPos) {
                    [pos] = await db('positions')
                        .insert({ title: updates.position_title, department_id: deptIdForPos })
                        .returning('*');
                }
                updates.position_id = pos?.position_id || null;
            } else {
                updates.position_id = null;
            }
            delete updates.position_title;
        }

        const [updated] = await db('employees')
            .where({ employee_id: req.params.id })
            .update(updates)
            .returning('*');

        if (!updated) return res.status(404).json({ error: 'Employee not found' });
        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// ============================================================
// DELETE /api/employees/:id
// ============================================================
export const deleteEmployee = async (req, res) => {
    try {
        const deleted = await db('employees').where({ employee_id: req.params.id }).del();
        if (!deleted) return res.status(404).json({ error: 'Employee not found' });
        res.json({ message: 'Employee deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// ============================================================
// PATCH /api/employees/:id/clock
// ============================================================
export const clockEmployee = async (req, res) => {
    try {
        const { action, employee_code_input, manager_employee_code } = req.body;

        const employee = await db('employees').where({ employee_id: req.params.id }).first();
        if (!employee) return res.status(404).json({ error: 'Employee not found' });

        // GM bypass — manager_id is null means top-level, can clock themselves
        const isGM = employee.manager_id === null;
        if (!isGM) {
            if (employee.employee_code !== employee_code_input) {
                return res.status(401).json({ error: 'Invalid employee ID' });
            }
            const manager = await db('employees')
                .where({ employee_code: manager_employee_code })
                .first();
            if (!manager) return res.status(401).json({ error: 'Invalid manager ID' });
            if (manager.employee_id !== employee.manager_id) {
                return res.status(401).json({ error: 'Manager does not supervise this employee' });
            }
        }

        if (action === 'clockIn'  && employee.clock_state === 'clockIn') {
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
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// ============================================================
// GET /api/employees/salesmen
// ============================================================
export const getSalesmen = async (req, res) => {
    try {
        const salesmen = await db('employees')
            .whereRaw("LOWER(employment_status) = 'active'")
            .select('employee_id', 'name', 'position_id', 'department_id');
        res.json(salesmen);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};