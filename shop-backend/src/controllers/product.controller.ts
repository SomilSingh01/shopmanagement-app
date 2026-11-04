import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { z } from 'zod';

const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  stock: z.number().int().nonnegative().default(0),
  lowStockThreshold: z.number().int().nonnegative().optional().default(5),
  unit: z.string().optional().default('pcs'),
  sku: z.string().optional(),
  dimensions: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  type: z.enum(['STANDARD', 'RAW_MATERIAL', 'FINISHED_GOOD']).optional().default('STANDARD'),
});

const updateProductSchema = createProductSchema.partial();

export class ProductController {
  static async getAll(req: Request, res: Response) {
    try {
      const products = await prisma.product.findMany({
        where: { userId: (req as any).user.id },
        orderBy: { createdAt: 'desc' },
      });
      res.json(products);
    } catch (error) {
      console.error('Get Products Error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const product = await prisma.product.findFirst({ 
        where: { id, userId: (req as any).user.id } 
      });
      if (!product) return res.status(404).json({ message: 'Product not found' });
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const data = createProductSchema.parse(req.body);
      const product = await prisma.product.create({ 
        data: { ...data, userId: (req as any).user.id } 
      });
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ errors: (error as any).errors });
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const data = updateProductSchema.parse(req.body);
      const product = await prisma.product.updateMany({ 
        where: { id, userId: (req as any).user.id }, 
        data 
      });
      if (product.count === 0) return res.status(404).json({ message: 'Product not found' });
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ errors: (error as any).errors });
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const deleted = await prisma.product.deleteMany({ 
        where: { id, userId: (req as any).user.id } 
      });
      if (deleted.count === 0) return res.status(404).json({ message: 'Product not found' });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
