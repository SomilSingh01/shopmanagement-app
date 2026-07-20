import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { z } from 'zod';

const createCustomerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
});

const updateCustomerSchema = createCustomerSchema.partial();

export class CustomerController {
  static async getAll(req: Request, res: Response) {
    try {
      const customers = await prisma.customer.findMany({
        where: { userId: (req as any).user.id },
        orderBy: { createdAt: 'desc' },
      });
      res.json(customers);
    } catch (error) {
      console.error('Get Customers Error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const customer = await prisma.customer.findFirst({ 
        where: { id, userId: (req as any).user.id }, 
        include: { orders: true } 
      });
      if (!customer) return res.status(404).json({ message: 'Customer not found' });
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const data = createCustomerSchema.parse(req.body);
      const existing = await prisma.customer.findUnique({ where: { email: data.email } });
      if (existing) return res.status(400).json({ message: 'Customer email already exists' });

      const customer = await prisma.customer.create({ 
        data: { ...data, userId: (req as any).user.id } 
      });
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ errors: (error as any).errors });
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const data = updateCustomerSchema.parse(req.body);
      const customer = await prisma.customer.updateMany({ 
        where: { id, userId: (req as any).user.id }, 
        data 
      });
      if (customer.count === 0) return res.status(404).json({ message: 'Customer not found' });
      res.json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ errors: (error as any).errors });
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const deleted = await prisma.customer.deleteMany({ 
        where: { id, userId: (req as any).user.id } 
      });
      if (deleted.count === 0) return res.status(404).json({ message: 'Customer not found' });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
