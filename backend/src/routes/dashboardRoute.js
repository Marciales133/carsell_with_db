import express from 'express';
import { getDashboardData } from '../controllers/dashboadController.js';

const router = express.Router();

router.get('/', getDashboardData);

export default router;