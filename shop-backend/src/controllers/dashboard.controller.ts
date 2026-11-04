import { Request, Response } from 'express';
import { prisma } from '../prisma';

export class DashboardController {
  static async getStats(req: Request, res: Response) {
    try {
      // 1. Total Revenue (Sum of all non-cancelled orders)
      const revenueResult = await prisma.order.aggregate({
        where: {
          userId: (req as any).user.id,
          status: {
            not: 'CANCELLED'
          }
        },
        _sum: {
          total: true
        }
      });
      const totalRevenue = revenueResult._sum.total || 0;

      // 2. Active Orders (Pending or Processing)
      const activeOrdersCount = await prisma.order.count({
        where: {
          userId: (req as any).user.id,
          status: {
            in: ['PENDING', 'PROCESSING']
          }
        }
      });

      // 3. Total Orders
      const totalOrdersCount = await prisma.order.count({
        where: {
          userId: (req as any).user.id
        }
      });

      // 4. Total Customers
      const totalCustomers = await prisma.customer.count({
        where: { userId: (req as any).user.id }
      });

      // 4. Total Products
      const totalProducts = await prisma.product.count({
        where: { userId: (req as any).user.id }
      });

      // 5. Daily Revenue for last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // 6 days ago + today = 7 days
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const recentOrdersList = await prisma.order.findMany({
        where: {
          userId: (req as any).user.id,
          status: { not: 'CANCELLED' },
          createdAt: { gte: sevenDaysAgo }
        },
        select: { total: true, createdAt: true }
      });

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const chartDataMap = new Map();
      
      // Initialize map with the last 7 days in order
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        chartDataMap.set(dayNames[d.getDay()], 0);
      }

      recentOrdersList.forEach(order => {
        const dayStr = dayNames[order.createdAt.getDay()];
        if (chartDataMap.has(dayStr)) {
          chartDataMap.set(dayStr, chartDataMap.get(dayStr) + order.total);
        }
      });

      const chartData = Array.from(chartDataMap, ([day, revenue]) => ({ day, revenue }));

      res.json({
        totalRevenue,
        activeOrders: activeOrdersCount,
        totalOrders: totalOrdersCount,
        totalCustomers,
        totalProducts,
        chartData
      });
    } catch (error) {
      console.error('Get Stats Error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getLowStockAlerts(req: Request, res: Response) {
    try {
      // Fetch products with stock <= 10
      // Fetch products that are at or below their individual low-stock threshold
      const allUserProducts = await prisma.product.findMany({
        where: {
          userId: (req as any).user.id,
        },
      });

      const lowStockProducts = allUserProducts
        .filter(product => product.stock <= (product.lowStockThreshold ?? 5))
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 10);
      
      res.json(lowStockProducts);
    } catch (error) {
      console.error('Low Stock Alerts Error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getRecentOrders(req: Request, res: Response) {
    try {
      // Fetch the 5 most recent orders with customer details
      const recentOrders = await prisma.order.findMany({
        where: { userId: (req as any).user.id },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5,
        include: {
          customer: { select: { name: true, email: true } },
        }
      });
      
      res.json(recentOrders);
    } catch (error) {
      console.error('Recent Orders Error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
