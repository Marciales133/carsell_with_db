import express from 'express';
import { 
        getAllCars, getCarById, 
        createCar, updateCar, 
        deleteCar, addStock 
    } 
from '../controllers/carsController.js';

const router = express.Router();

router.get('/',           getAllCars);
router.get('/:id',        getCarById);
router.post('/',          createCar);
router.put('/:id',        updateCar);
router.delete('/:id',     deleteCar);
router.patch('/:id/stock', addStock);  

export default router;