import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { z } from 'zod';

const bomItemSchema = z.object({
  rawMaterialId: z.string().uuid(),
  quantity: z.number().positive(),
});

export class BOMController {
  // Get the BOM for a specific Finished Good
  static async getBOM(req: Request, res: Response) {
    try {
      const finishedGoodId = req.params.finishedGoodId as string;
      const bomItems = await prisma.bOMItem.findMany({
        where: { 
          finishedGoodId,
          userId: (req as any).user.id 
        },
        include: {
          rawMaterial: true,
        },
      });
      res.json(bomItems);
    } catch (error) {
      console.error('Get BOM Error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Add a raw material to a Finished Good's BOM
  static async addBOMItem(req: Request, res: Response) {
    try {
      const finishedGoodId = req.params.finishedGoodId as string;
      const { rawMaterialId, quantity } = bomItemSchema.parse(req.body);

      // Verify the finished good exists and belongs to user
      const finishedGood = await prisma.product.findFirst({
        where: { id: finishedGoodId, userId: (req as any).user.id }
      });
      if (!finishedGood) return res.status(404).json({ message: 'Finished Good not found' });

      // Verify the raw material exists and belongs to user
      const rawMaterial = await prisma.product.findFirst({
        where: { id: rawMaterialId, userId: (req as any).user.id }
      });
      if (!rawMaterial) return res.status(404).json({ message: 'Raw Material not found' });

      // Check if it already exists, if so update it
      const existingItem = await prisma.bOMItem.findFirst({
        where: { finishedGoodId, rawMaterialId, userId: (req as any).user.id }
      });

      if (existingItem) {
        const updated = await prisma.bOMItem.update({
          where: { id: existingItem.id },
          data: { quantity }
        });
        return res.json(updated);
      }

      const bomItem = await prisma.bOMItem.create({
        data: {
          finishedGoodId,
          rawMaterialId,
          quantity,
          userId: (req as any).user.id
        }
      });
      res.status(201).json(bomItem);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ errors: (error as any).errors });
      console.error('Add BOM Item Error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Remove an item from the BOM
  static async removeBOMItem(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const deleted = await prisma.bOMItem.deleteMany({
        where: { id, userId: (req as any).user.id }
      });
      if (deleted.count === 0) return res.status(404).json({ message: 'BOM Item not found' });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
