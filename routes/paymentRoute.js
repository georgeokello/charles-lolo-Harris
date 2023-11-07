import { Router } from 'express';
import { payments } from '../controllers/paymentController';

const router = Router();

// @route   POST /payments
// @desc    Place new order
// @access  Public
router.post('/', payments);


export default router;