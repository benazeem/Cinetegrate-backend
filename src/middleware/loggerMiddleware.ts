// middleware/devLogger.ts
import type { Request, Response, NextFunction } from 'express';

const devLogger = (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();
    
    // Log when request comes in (optional - remove if you don't want it)
    console.log(`${getColor('incoming')}→ ${req.method} ${req.url}`);
    
    // Log when response is sent
    res.on('finish', () => {
        const duration = Date.now() - start;
        const status = res.statusCode;
        
        console.log(`${getStatusColor(status)}${getMethodIcon(req.method)} ${req.method} ${req.url} ${status} ${duration}ms\x1b[0m`);
    });
    
    next();
};

// Helper functions for colors
const getStatusColor = (status: number): string => {
    if (status >= 500) return '\x1b[31m'; // red for server errors
    if (status >= 400) return '\x1b[33m'; // yellow for client errors
    if (status >= 300) return '\x1b[36m'; // cyan for redirects
    return '\x1b[32m'; // green for success
};

const getMethodIcon = (method: string): string => {
    const icons: Record<string, string> = {
        GET: '📥',
        POST: '📝',
        PUT: '✏️',
        DELETE: '🗑️',
        PATCH: '🩹'
    };
    return icons[method] || '📄';
};

const getColor = (type: 'incoming'): string => {
    return type === 'incoming' ? '\x1b[90m' : ''; // gray for incoming
};

export default devLogger;