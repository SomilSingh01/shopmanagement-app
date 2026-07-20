import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { z } from 'zod';

const createMfgSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export class ManufacturingController {
  // Get all manufacturing orders for the user
  static async getAll(req: Request, res: Response) {
    try {
      const orders = await prisma.manufacturingOrder.findMany({
        where: { userId: (req as any).user.id },
        include: { product: true },
        orderBy: { createdAt: 'desc' }
      });
      res.json(orders);
    } catch (error) {
      console.error('Get Mfg Orders Error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Create a PLANNED manufacturing order
  static async createOrder(req: Request, res: Response) {
    try {
      const { productId, quantity } = createMfgSchema.parse(req.body);

      // Verify product is a FINISHED_GOOD
      const product = await prisma.product.findFirst({
        where: { id: productId, userId: (req as any).user.id }
      });
      if (!product) return res.status(404).json({ message: 'Product not found' });
      if (product.type !== 'FINISHED_GOOD') {
        return res.status(400).json({ message: 'Only FINISHED_GOOD products can be manufactured' });
      }

      const order = await prisma.manufacturingOrder.create({
        data: {
          productId,
          quantity,
          status: 'PLANNED',
          userId: (req as any).user.id
        },
        include: { product: true }
      });
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ errors: (error as any).errors });
      console.error('Create Mfg Order Error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Complete a manufacturing order (Runs the Transaction)
  static async completeOrder(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const userId = (req as any).user.id;

      // 1. Fetch the Order
      const order = await prisma.manufacturingOrder.findFirst({
        where: { id, userId }
      });
      if (!order) return res.status(404).json({ message: 'Manufacturing Order not found' });
      if (order.status === 'COMPLETED') return res.status(400).json({ message: 'Order is already completed' });

      // 2. Fetch the BOM for this product
      const bomItems = await prisma.bOMItem.findMany({
        where: { finishedGoodId: order.productId, userId },
        include: { rawMaterial: true }
      });

      if (bomItems.length === 0) {
        return res.status(400).json({ message: 'This product has no Bill of Materials defined.' });
      }

      // 3. Execute Transaction
      await prisma.$transaction(async (tx) => {
        // A. Deduct Raw Materials
        for (const item of bomItems) {
          const totalNeeded = item.quantity * order.quantity;
          
          if (item.rawMaterial.stock < totalNeeded) {
            throw new Error(`Insufficient stock for ${item.rawMaterial.name}. Needed: ${totalNeeded}, Available: ${item.rawMaterial.stock}`);
          }

          await tx.product.update({
            where: { id: item.rawMaterialId },
            data: { stock: { decrement: totalNeeded } }
          });
        }

        // B. Increase Finished Good Stock
        await tx.product.update({
          where: { id: order.productId },
          data: { stock: { increment: order.quantity } }
        });

        // C. Mark Order Completed
        await tx.manufacturingOrder.update({
          where: { id: order.id },
          data: { status: 'COMPLETED' }
        });
      });

      res.json({ message: 'Manufacturing completed successfully' });
    } catch (error: any) {
      console.error('Complete Mfg Order Error:', error);
      // Catch our custom insufficient stock error
      if (error.message && error.message.includes('Insufficient stock')) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
