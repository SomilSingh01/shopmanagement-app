import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { z } from 'zod';

const createOrderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
});

const createOrderSchema = z.object({
  customerId: z.string().uuid(),
  items: z.array(createOrderItemSchema).min(1),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
});

export class OrderController {
  static async getAll(req: Request, res: Response) {
    try {
      const { status } = req.query;
      const whereClause = status ? { status: status as any } : {};

      const orders = await prisma.order.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true, email: true } },
          user: { select: { name: true } },
          items: true,
        },
      });
      res.json(orders);
    } catch (error) {
      console.error('Get Orders Error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          customer: true,
          user: { select: { name: true, email: true } },
          items: {
            include: { product: true }
          },
        },
      });
      if (!order) return res.status(404).json({ message: 'Order not found' });
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const data = createOrderSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Calculate total
      const total = data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // Create order and order items in a transaction
      const order = await prisma.order.create({
        data: {
          total,
          userId,
          customerId: data.customerId,
          items: {
            create: data.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
        include: { items: true },
      });

      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ errors: (error as any).errors });
      console.error('Create Order Error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async updateStatus(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { status } = updateOrderStatusSchema.parse(req.body);
      
      const order = await prisma.order.update({
        where: { id },
        data: { status },
      });
      
      res.json(order);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ errors: (error as any).errors });
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
