import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized - No token provided' });
  }
  const decoded = AuthService.verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ message: 'Unauthorized - Invalid token' });
  }

  req.user = decoded;
  next();
};

export const optionalAuthenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.token;

  if (!token) {
    return next();
  }
  
  try {
    const decoded = AuthService.verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  } catch (error) {
    // Ignore invalid tokens
  }
  
  next();
};
