import db from '../config/db.js';

// GET /api/cars
export const getAllCars = async (req, res) => {
    try {
        const cars = await db('cars').select('*').orderBy('brand');
        res.json(cars);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/cars/:id
export const getCarById = async (req, res) => {
    try {
        const car = await db('cars').where({ car_id: req.params.id }).first();
        if (!car) return res.status(404).json({ error: 'Car not found' });
        res.json(car);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /api/cars
export const createCar = async (req, res) => {
    try {
        const { type, brand, model, year, color, quantity, price } = req.body;
        const [newCar] = await db('cars')
        .insert({
            type, brand, model, year, color,
            quantity, price,
            in_stock: quantity,
            sold: 0,
            reserved: 0
        })
        .returning('*');
        res.status(201).json(newCar);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// PUT /api/cars/:id  — full update
export const updateCar = async (req, res) => {
    try {
        const [updated] = await db('cars')
        .where({ car_id: req.params.id })
        .update(req.body)
        .returning('*');
        if (!updated) return res.status(404).json({ error: 'Car not found' });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE /api/cars/:id
export const deleteCar = async (req, res) => {
    try {
        const deleted = await db('cars').where({ car_id: req.params.id }).del();
        if (!deleted) return res.status(404).json({ error: 'Car not found' });
        res.json({ message: 'Car deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// PATCH /api/cars/:id/stock  — mirrors your frontend "Add to Stock" button
// body: { amount: 5 }
export const addStock = async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || isNaN(amount)) return res.status(400).json({ error: 'Invalid amount' });

        const car = await db('cars').where({ car_id: req.params.id }).first();
        if (!car) return res.status(404).json({ error: 'Car not found' });

        const [updated] = await db('cars')
        .where({ car_id: req.params.id })
        .update({
            in_stock: car.in_stock + Number(amount),
            quantity: car.quantity + Number(amount)
        })
        .returning('*');
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};