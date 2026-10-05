import { Request, Response, NextFunction } from 'express';

type AsyncFunction = (req: Request | any, res: Response, next: NextFunction) => Promise<any>;

/**
 * Wraps an async express route to automatically catch Promise rejections
 * and pass them to the express error handler or send a 500 response.
 */
export const asyncHandler = (fn: AsyncFunction) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    console.error('API Error:', err);
    const isProd = process.env.NODE_ENV === 'production';
    res.status(500).json({
      error: 'Server error',
      ...(!isProd && { details: err instanceof Error ? err.message : String(err) }),
    });
  });
};
