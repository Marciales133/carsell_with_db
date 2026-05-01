import db from '../config/db.js';

// GET /api/sales  — supports ?filter=today|week|month|year|all and ?salesman=name
export const getAllSales = async (req, res) => {
    try {
        const { filter, employee_id } = req.query;

        let query = db('sales')
        .select(
            'sales.*',
            'clients.name as client_name',
            'employees.name as employee_name',
            'cars.brand', 'cars.model', 'cars.year', 'cars.color'
        )
        .join('clients', 'sales.client_id', 'clients.client_id')
        .join('employees', 'sales.employee_id', 'employees.employee_id')
        .join('cars', 'sales.car_id', 'cars.car_id')
        .orderBy('sales.sale_date', 'desc');

        // Filter by salesman
        if (employee_id) {
        query = query.where('sales.employee_id', employee_id);
        }

        // Filter by date range — mirrors your today/week/month/year frontend logic
        if (filter) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        if (filter === 'today') {
            query = query.whereRaw('sale_date = ?', [now.toISOString().split('T')[0]]);
        } else if (filter === 'week') {
            const weekAgo = new Date(now);
            weekAgo.setDate(weekAgo.getDate() - 7);
            query = query.whereBetween('sale_date', [weekAgo, now]);
        } else if (filter === 'month') {
            const monthAgo = new Date(now);
            monthAgo.setDate(monthAgo.getDate() - 31);
            query = query.whereBetween('sale_date', [monthAgo, now]);
        } else if (filter === 'year') {
            const yearAgo = new Date(now);
            yearAgo.setFullYear(yearAgo.getFullYear() - 1);
            query = query.whereBetween('sale_date', [yearAgo, now]);
        }
        }

        const sales = await query;
        res.json(sales);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/sales/:id
export const getSaleById = async (req, res) => {
    try {
        const sale = await db('sales')
        .where({ 'sales.sale_id': req.params.id })
        .join('clients', 'sales.client_id', 'clients.client_id')
        .join('employees', 'sales.employee_id', 'employees.employee_id')
        .join('cars', 'sales.car_id', 'cars.car_id')
        .select(
            'sales.*',
            'clients.name as client_name',
            'employees.name as employee_name',
            'cars.brand', 'cars.model', 'cars.year', 'cars.color'
        )
        .first();
        if (!sale) return res.status(404).json({ error: 'Sale not found' });
        res.json(sale);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /api/sales  — mirrors your addNewClient() and bindClient() "Add" button logic
// This is a transaction: create sale + decrement car stock + update client
// body: { client_id, employee_id, car_id, profit, status, quantity }
export const createSale = async (req, res) => {
    const trx = await db.transaction();
    try {
        const { client_id, employee_id, car_id, profit, status, quantity = 1 } = req.body;

        // Verify car has enough stock
        const car = await trx('cars').where({ car_id }).first();
        if (!car) { await trx.rollback(); return res.status(404).json({ error: 'Car not found' }); }
        if (car.in_stock < quantity) { await trx.rollback(); return res.status(400).json({ error: `Insufficient stock. Only ${car.in_stock} left.` }); }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Insert the sale
        const [newSale] = await trx('sales')
        .insert({
            sale_date: today,
            profit,
            status: status || 'In-Progress',
            client_id,
            employee_id,
            car_id
        })
        .returning('*');

        // Decrement car stock — mirrors: cars[Vehecle].inStock -= 1; cars[Vehecle].sold += 1;
        await trx('cars').where({ car_id }).update({
        in_stock: car.in_stock - quantity,
        quantity: car.quantity - quantity,
        sold: car.sold + quantity
        });

        // Update client: bump number_of_purchases and last_purchase_date
        const client = await trx('clients').where({ client_id }).first();
        if (client) {
        await trx('clients').where({ client_id }).update({
            number_of_purchases: client.number_of_purchases + quantity,
            last_purchase_date: today
        });
        }

        await trx.commit();
        res.status(201).json(newSale);
    } catch (err) {
        await trx.rollback();
        res.status(500).json({ error: err.message });
    }
};

// PATCH /api/sales/:id/status  — update sale status (Completed, In-Progress, Canceled)
// body: { status: 'Completed' }
export const updateSaleStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['Completed', 'In-Progress', 'Canceled'];
        if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
        }
        const [updated] = await db('sales')
        .where({ sale_id: req.params.id })
        .update({ status })
        .returning('*');
        if (!updated) return res.status(404).json({ error: 'Sale not found' });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};