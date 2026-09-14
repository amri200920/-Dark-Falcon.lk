import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  console.error('🦅 Server Error:', err.message || err);

  const status = err.status || err.statusCode || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.expose || status < 500 ? err.message : 'An unexpected error occurred on the Dark Falcon server.';

  res.status(status).json({
    success: false,
    error: err.name || 'ServerError',
    code,
    message,
  });
}
