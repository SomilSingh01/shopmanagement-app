import { Router } from 'express';
import { BOMController } from '../controllers/bom.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/:finishedGoodId', BOMController.getBOM);
router.post('/:finishedGoodId', BOMController.addBOMItem);
router.delete('/:id', BOMController.removeBOMItem);

export default router;
