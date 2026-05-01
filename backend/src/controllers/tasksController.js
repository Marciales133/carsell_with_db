import db from '../config/db.js';

// GET /api/tasks
export const getAllTasks = async (req, res) => {
    try {
        const tasks = await db('tasks').select('*').orderBy('created_at', 'desc');
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /api/tasks  — mirrors your Enter key listener on addtask input
// body: { description: 'Follow up with John' }
export const createTask = async (req, res) => {
    try {
        const { description } = req.body;
        if (!description || description.trim() === '') {
        return res.status(400).json({ error: 'Description is required' });
        }
        const [newTask] = await db('tasks')
        .insert({ description: description.trim() })
        .returning('*');
        res.status(201).json(newTask);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE /api/tasks/:id  — mirrors your click-to-delete paragraph listener
export const deleteTask = async (req, res) => {
    try {
        const deleted = await db('tasks').where({ task_id: req.params.id }).del();
        if (!deleted) return res.status(404).json({ error: 'Task not found' });
        res.json({ message: 'Task deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};