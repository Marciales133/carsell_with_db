import express from 'express';
import { 
    getAllSales, getSaleById, 
    createSale, updateSaleStatus 
    } 
from '../controllers/salesController.js';

const router = express.Router();

router.get('/',               getAllSales);    // supports ?filter=today|week|month|year&employee_id=1
router.get('/:id',            getSaleById);
router.post('/',              createSale);
router.patch('/:id/status',   updateSaleStatus);

export default router;