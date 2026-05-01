import db from '../config/db.js';

// GET /api/dashboard
// Returns everything your dashboard.js needs in one call
export const getDashboardData = async (req, res) => {
    try {
        // 1. Total active employees
        const [{ count: totalEmployees }] = await db('employees')
        .whereRaw("LOWER(status) = 'active'")
        .count('employee_id as count');

        // 2. Monthly sales count
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const [{ count: monthlySales }] = await db('sales')
        .where('sale_date', '>=', monthStart)
        .count('sale_id as count');

        // 3. Total cars in inventory (sum of in_stock)
        const [{ total: carsInInventory }] = await db('cars').sum('in_stock as total');

        // 4. Total revenue this month (sum of profit)
        const [{ total: totalRevenue }] = await db('sales')
        .where('sale_date', '>=', monthStart)
        .sum('profit as total');

        // 5. New clients registered this month
        const newClients = await db('clients')
        .whereRaw("LOWER(client_type) = 'new'")
        .where('date_registered', '>=', monthStart)
        .select('client_id', 'name', 'date_registered', 'phone', 'email')
        .orderBy('date_registered', 'desc')
        .limit(5);

        // 6. Low stock cars (in_stock <= 1) sorted by sold desc
        const lowStock = await db('cars')
        .where('in_stock', '<=', 1)
        .select('car_id', 'brand', 'model', 'year', 'color', 'in_stock', 'sold')
        .orderBy('sold', 'desc')
        .limit(4);

        // 7. Top 3 best-selling cars
        const top3Cars = await db('cars')
        .select('car_id', 'brand', 'model', 'year', 'color', 'sold')
        .orderBy('sold', 'desc')
        .limit(3);

        // 8. Sales trend — last 5 months (current + 4 previous)
        const monthlyTrend = [];
        for (let i = 4; i >= 0; i--) {
            const d = new Date();
            d.setDate(1);
            d.setMonth(d.getMonth() - i);
            const start = new Date(d.getFullYear(), d.getMonth(), 1);
            const end   = new Date(d.getFullYear(), d.getMonth() + 1, 1);
            const label = d.toLocaleString('default', { month: 'short' }).toLowerCase();

            const [{ total: revenue }] = await db('sales')
                .whereBetween('sale_date', [start, end])
                .sum('profit as total');

            monthlyTrend.push({ label, revenue: Number(revenue) || 0 });
        }

        res.json({
            totalEmployees: Number(totalEmployees),
            monthlySales:   Number(monthlySales),
            carsInInventory: Number(carsInInventory) || 0,
            totalRevenue:   Number(totalRevenue) || 0,
            newClients,
            lowStock,
            top3Cars,
            monthlyTrend
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};