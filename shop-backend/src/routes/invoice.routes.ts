import { Router } from 'express';
import { InvoiceController } from '../controllers/invoice.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', InvoiceController.getInvoices);
router.get('/:orderId', InvoiceController.getInvoiceById);

export default router;
