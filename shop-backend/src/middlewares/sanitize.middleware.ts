import { Request, Response, NextFunction } from 'express';

/**
 * Basic XSS Sanitization Middleware
 * Recursively strips `<` and `>` from all string values in req.body, req.query, and req.params
 * to prevent basic script injection.
 */
const sanitize = (obj: any): any => {
  if (typeof obj === 'string') {
    return obj.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitize(item));
  }
  if (typeof obj === 'object' && obj !== null) {
    const sanitizedObj: any = {};
    for (const key in obj) {
      sanitizedObj[key] = sanitize(obj[key]);
    }
    return sanitizedObj;
  }
  return obj;
};

export const sanitizeInputs = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);
  
  next();
};
