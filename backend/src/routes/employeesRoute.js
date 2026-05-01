import express from 'express';
import { 
        getAllEmployees, getEmployeeById, 
        createEmployee, updateEmployee, 
        deleteEmployee, clockEmployee, 
        getSalesmen 
    } 
from '../controllers/employeesController.js';

const router = express.Router();

router.get('/salesmen',       getSalesmen);       // must be before /:id
router.get('/',               getAllEmployees);
router.get('/:id',            getEmployeeById);
router.post('/',              createEmployee);
router.put('/:id',            updateEmployee);
router.delete('/:id',         deleteEmployee);
router.patch('/:id/clock',    clockEmployee);     // Clock in/out

export default router;