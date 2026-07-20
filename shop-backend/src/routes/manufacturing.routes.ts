import { Router } from 'express';
import { ManufacturingController } from '../controllers/manufacturing.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', ManufacturingController.getAll);
router.post('/', ManufacturingController.createOrder);
router.post('/:id/complete', ManufacturingController.completeOrder);

export default router;
