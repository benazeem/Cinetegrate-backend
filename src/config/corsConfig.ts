import type { CorsOptions } from 'cors';

// Define the exact origin of your frontend for each environment
// It's best practice to load these from environment variables (e.g., using 'dotenv')
const DEV_ORIGIN = process.env.DEV_CLIENT_URL || 'http://localhost:3000'; 
const PROD_ORIGIN = process.env.PROD_CLIENT_URL || 'https://your-production-app.com'; 

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
    const allowedOrigin = isProduction ? PROD_ORIGIN : DEV_ORIGIN;

    return {
        // Set the dynamic origin
        origin: allowedOrigin,
        
        // Define allowed interactions
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        
        // Allow cookies or authorization headers to be sent
        credentials: true, 
        
        // Caching for preflight requests
        maxAge: 86400 // Cache preflight response for 24 hours
    };
};

export default getCorsConfig;