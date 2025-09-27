import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodIssue } from 'zod';

export interface ValidatedRequest<T = any> extends Request {
  validatedData: T;
}

export const validate = (schema: z.ZodSchema<any>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validatedData = schema.parse(req.body);
      // Add validatedData to the request object
      Object.assign(req, { validatedData });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((err: ZodIssue) => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errorMessages
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };
};

export const validateQuery = (schema: z.ZodSchema<any>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validatedData = schema.parse(req.query);
      (req as ValidatedRequest).validatedData = validatedData;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((err: ZodIssue) => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        res.status(400).json({
          success: false,
          error: 'Query validation failed',
          details: errorMessages
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };
};