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
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const { status } = req.query;
      const whereClause = {
        ...(status ? { status: status as any } : {}),
        userId,
      };

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
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const id = req.params.id as string;
      const order = await prisma.order.findFirst({
        where: { id, userId },
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
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // 1. Verify customer exists and belongs to this user
      const customer = await prisma.customer.findFirst({
        where: { id: data.customerId, userId }
      });
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      // 2. Fetch all products (including BOM items for finished goods) and verify sufficient stock
      const productIds = data.items.map(i => i.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds }, userId },
        include: {
          bomItems: {
            include: { rawMaterial: true }
          }
        }
      });

      // Track running stock balances to prevent overdraft across multiple items in the same cart
      const stockTracker = new Map<string, number>();

      for (const item of data.items) {
        const product = products.find(p => p.id === item.productId);
        if (!product) {
          return res.status(404).json({ message: `Product not found or unauthorized` });
        }

        if (product.type === 'FINISHED_GOOD') {
          const currentStock = stockTracker.get(product.id) ?? product.stock;
          if (currentStock >= item.quantity) {
            // Pre-manufactured stock covers this item
            stockTracker.set(product.id, currentStock - item.quantity);
          } else {
            // Need to make remaining units from raw materials
            const neededUnits = item.quantity - Math.max(0, currentStock);
            stockTracker.set(product.id, 0);

            if (!product.bomItems || product.bomItems.length === 0) {
              return res.status(400).json({
                message: `Cannot order "${product.name}": Insufficient stock and no raw materials recipe defined.`
              });
            }

            for (const bom of product.bomItems) {
              const neededRawQty = bom.quantity * neededUnits;
              const availableRaw = stockTracker.get(bom.rawMaterialId) ?? bom.rawMaterial.stock;

              if (availableRaw < neededRawQty) {
                return res.status(400).json({
                  message: `Cannot order "${product.name}": Insufficient raw material "${bom.rawMaterial.name}". Needed: ${neededRawQty} ${bom.rawMaterial.unit || 'units'}, Available: ${availableRaw}`
                });
              }

              stockTracker.set(bom.rawMaterialId, availableRaw - neededRawQty);
            }
          }
        } else {
          const currentStock = stockTracker.get(product.id) ?? product.stock;
          if (currentStock < item.quantity) {
            return res.status(400).json({
              message: `Insufficient stock for "${product.name}". Available: ${currentStock}, Requested: ${item.quantity}`
            });
          }
          stockTracker.set(product.id, currentStock - item.quantity);
        }
      }

      // 3. Calculate total
      const total = data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // 4. Atomically deduct stock (or raw materials for made-to-order goods) and create order with items
      const order = await prisma.$transaction(async (tx) => {
        for (const item of data.items) {
          const product = products.find(p => p.id === item.productId)!;

          if (product.type === 'FINISHED_GOOD') {
            if (product.stock >= item.quantity) {
              await tx.product.update({
                where: { id: item.productId },
                data: { stock: { decrement: item.quantity } }
              });
            } else {
              if (product.stock > 0) {
                await tx.product.update({
                  where: { id: item.productId },
                  data: { stock: 0 }
                });
              }
              const neededUnits = item.quantity - Math.max(0, product.stock);
              for (const bom of product.bomItems) {
                const neededRawQty = bom.quantity * neededUnits;
                const decrementQty = Math.max(1, Math.ceil(neededRawQty));
                await tx.product.update({
                  where: { id: bom.rawMaterialId },
                  data: { stock: { decrement: decrementQty } }
                });
              }
            }
          } else {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } }
            });
          }
        }

        return tx.order.create({
          data: {
            total,
            userId,
            customerId: data.customerId,
            status: 'PROCESSING', // Finished goods go straight to Processing
            items: {
              create: data.items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
              })),
            },
          },
          include: { items: true, customer: true },
        });
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
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const id = req.params.id as string;
      const { status } = updateOrderStatusSchema.parse(req.body);
      
      const existingOrder = await prisma.order.findFirst({
        where: { id, userId },
        include: { items: true }
      });
      if (!existingOrder) return res.status(404).json({ message: 'Order not found' });

      // If status hasn't changed, return early
      if (existingOrder.status === status) {
        return res.json(existingOrder);
      }

      // Execute status update and stock reconciliation atomically
      const updatedOrder = await prisma.$transaction(async (tx) => {
        // If cancelling order: restore stock back to inventory
        if (status === 'CANCELLED' && existingOrder.status !== 'CANCELLED') {
          for (const item of existingOrder.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } }
            });
          }
        }
        // If reactivating from cancelled: re-deduct stock
        else if (existingOrder.status === 'CANCELLED' && status !== 'CANCELLED') {
          for (const item of existingOrder.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } }
            });
          }
        }

        return tx.order.update({
          where: { id },
          data: { status },
        });
      });
      
      res.json(updatedOrder);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ errors: (error as any).errors });
      console.error('Update Order Status Error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
