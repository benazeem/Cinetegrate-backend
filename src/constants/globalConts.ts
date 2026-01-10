export const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
      process.env.DEV_CLIENT_URL || 'http://localhost:3000',
      process.env.PROD_CLIENT_URL || 'https://your-production-app.com',
    ];