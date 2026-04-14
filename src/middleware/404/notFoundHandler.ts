import type { Request, Response, NextFunction } from 'express';

const notFoundHandler = (req: Request, res: Response, _next: NextFunction): void => {
  res.status(404).json({
    message: `The resource at ${req.originalUrl} was not found on this server.`,
    data: {
      code: 'not_found',
      path: req.originalUrl,
    },
  });
};

export default notFoundHandler;
