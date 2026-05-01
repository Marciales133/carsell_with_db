import express from 'express';
import { 
        getAllClients, getClientById, 
        createClient, updateClient, 
        deleteClient, recordPurchase 
    } 
from '../controllers/clientsController.js';

const router = express.Router();

router.get('/',                   getAllClients);
router.get('/:id',                getClientById);
router.post('/',                  createClient);
router.put('/:id',                updateClient);
router.delete('/:id',             deleteClient);
router.patch('/:id/purchase',     recordPurchase);  // Add purchase button

export default router;