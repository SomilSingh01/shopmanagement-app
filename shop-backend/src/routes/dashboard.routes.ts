import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/stats', DashboardController.getStats);
router.get('/low-stock', DashboardController.getLowStockAlerts);
router.get('/recent-orders', DashboardController.getRecentOrders);

export default router;
