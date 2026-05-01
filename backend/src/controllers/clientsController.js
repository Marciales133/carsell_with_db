import db from '../config/db.js';

// GET /api/clients
export const getAllClients = async (req, res) => {
    try {
        const clients = await db('clients').select('*').orderBy('name');
        res.json(clients);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/clients/:id
export const getClientById = async (req, res) => {
    try {
        const client = await db('clients').where({ client_id: req.params.id }).first();
        if (!client) return res.status(404).json({ error: 'Client not found' });
        res.json(client);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /api/clients  — mirrors your addNewClient() frontend logic
// body: { name, status, client_type, phone, email, date_registered, address }
export const createClient = async (req, res) => {
    try {
        const { name, status, client_type, phone, email, date_registered, address } = req.body;
        const [newClient] = await db('clients')
        .insert({
            name,
            status: status || 'Active',
            client_type: client_type || 'New',
            phone,
            email,
            date_registered: date_registered || new Date(),
            last_purchase_date: null,
            address,
            number_of_purchases: 0
        })
        .returning('*');
        res.status(201).json(newClient);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// PUT /api/clients/:id  — full update (your "Change" button)
export const updateClient = async (req, res) => {
    try {
        const [updated] = await db('clients')
        .where({ client_id: req.params.id })
        .update(req.body)
        .returning('*');
        if (!updated) return res.status(404).json({ error: 'Client not found' });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE /api/clients/:id
export const deleteClient = async (req, res) => {
    try {
        const deleted = await db('clients').where({ client_id: req.params.id }).del();
        if (!deleted) return res.status(404).json({ error: 'Client not found' });
        res.json({ message: 'Client deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// PATCH /api/clients/:id/purchase  — mirrors your bindClient "Add" button logic
// Increments number_of_purchases and updates last_purchase_date
// body: { purchases: 2 }
export const recordPurchase = async (req, res) => {
    try {
        const { purchases } = req.body;
        if (!purchases || isNaN(purchases)) return res.status(400).json({ error: 'Invalid purchases value' });

        const client = await db('clients').where({ client_id: req.params.id }).first();
        if (!client) return res.status(404).json({ error: 'Client not found' });

        const [updated] = await db('clients')
        .where({ client_id: req.params.id })
        .update({
            number_of_purchases: client.number_of_purchases + Number(purchases),
            last_purchase_date: new Date()
        })
        .returning('*');
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};