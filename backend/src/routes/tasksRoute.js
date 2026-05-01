import express from 'express';
import { 
    getAllTasks, createTask, 
    deleteTask 
    } 
from '../controllers/tasksController.js';

const router = express.Router();

router.get('/',       getAllTasks);
router.post('/',      createTask);
router.delete('/:id', deleteTask);

export default router;