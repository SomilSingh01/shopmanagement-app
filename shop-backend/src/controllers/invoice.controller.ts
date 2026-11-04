import { Request, Response } from 'express';
import { prisma } from '../prisma';

export class InvoiceController {
  /**
   * Get all invoices (delivered orders formatted as invoices)
   */
  static async getInvoices(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;

      // Get the shop owner's details for invoice branding
      const shopOwner = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, shopName: true, shopAddress: true, phone: true, email: true }
      });

      // Get all delivered orders as invoices
      const orders = await prisma.order.findMany({
        where: {
          userId,
          status: 'DELIVERED'
        },
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true, email: true, phone: true } },
          items: {
            include: {
              product: { select: { name: true, sku: true, unit: true } }
            }
          }
        }
      });

      // Format as invoices
      const invoices = orders.map((order, index) => {
        const invoiceNumber = `INV-${order.createdAt.getFullYear()}${String(order.createdAt.getMonth() + 1).padStart(2, '0')}-${String(orders.length - index).padStart(4, '0')}`;
        
        return {
          id: order.id,
          invoiceNumber,
          customer: order.customer,
          items: order.items.map(item => ({
            name: item.product.name,
            sku: item.product.sku,
            unit: item.product.unit,
            quantity: item.quantity,
            unitPrice: item.price,
            total: item.quantity * item.price
          })),
          subtotal: order.total,
          tax: 0,
          total: order.total,
          status: 'PAID',
          createdAt: order.createdAt,
          shop: shopOwner
        };
      });

      res.json(invoices);
    } catch (error) {
      console.error('Get Invoices Error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Get a single invoice by order ID
   */
  static async getInvoiceById(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const orderId = req.params.orderId;

      const shopOwner = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, shopName: true, shopAddress: true, phone: true, email: true }
      });

      const safeOrderId = typeof orderId === 'string' ? orderId : String(orderId);
      const order = await prisma.order.findFirst({
        where: { id: safeOrderId, userId },
        include: {
          customer: { select: { name: true, email: true, phone: true } },
          items: {
            include: {
              product: { select: { name: true, sku: true, unit: true } }
            }
          }
        }
      });

      if (!order) {
        return res.status(404).json({ message: 'Invoice not found' });
      }

      const invoiceNumber = `INV-${order.createdAt.getFullYear()}${String(order.createdAt.getMonth() + 1).padStart(2, '0')}-${order.id.slice(0, 8).toUpperCase()}`;

      res.json({
        id: order.id,
        invoiceNumber,
        customer: order.customer,
        items: order.items.map(item => ({
          name: item.product.name,
          sku: item.product.sku,
          unit: item.product.unit,
          quantity: item.quantity,
          unitPrice: item.price,
          total: item.quantity * item.price
        })),
        subtotal: order.total,
        tax: 0,
        total: order.total,
        status: order.status === 'DELIVERED' ? 'PAID' : 'UNPAID',
        createdAt: order.createdAt,
        shop: shopOwner
      });
    } catch (error) {
      console.error('Get Invoice By ID Error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
