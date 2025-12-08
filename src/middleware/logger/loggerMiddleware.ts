import type { Request, Response, NextFunction } from 'express';


const loggerMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    // 1. Record the start time of the request
    const start: number = Date.now();

    // 2. Log the request method and URL when the request comes in
    console.log(`[${new Date().toISOString()}] Incoming Request: ${req.method} ${req.url}`);

    // 3. Attach an event listener to the 'finish' event of the response object.
    //    This is triggered when the response headers and body have been sent to the client.
    res.on('finish', (): void => {
        // 4. Calculate the response time (latency)
        const duration: number = Date.now() - start;

        // 5. Log the response details
        console.log(
            `[${new Date().toISOString()}] Processed Request: ` +
            `${req.method} ${req.originalUrl} ` +
            `Status: ${res.statusCode} ` +
            `Latency: ${duration}ms`
        );
    });

    // 6. Move to the next middleware or the route handler
    next();
};

export default loggerMiddleware;