import { ALLOWED_ORIGINS } from 'constants/globalConts.js';
import type { CorsOptions } from 'cors';

 /**
 * Returns the appropriate CORS configuration based on the current environment.
 * @returns CorsOptions object for the Express 'cors' middleware.
 */
const getCorsConfig = (): CorsOptions => {
    // Check if the environment is explicitly set to production
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Determine the allowed origin
    // In production, strictly use the production URL.
    // In any other environment (development, staging, test), use the development URL.
    const allowedOrigin = ALLOWED_ORIGINS;

    return {
        // Set the dynamic origin
        origin: allowedOrigin,
        
        // Define allowed interactions
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
        
        
        // Allow cookies or authorization headers to be sent
        credentials: true, 
        
        // Caching for preflight requests
        maxAge: 86400 // Cache preflight response for 24 hours
    };
};

export default getCorsConfig;