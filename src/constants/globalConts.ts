export const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [process.env.DEV_CLIENT_URL, process.env.PROD_CLIENT_URL];
