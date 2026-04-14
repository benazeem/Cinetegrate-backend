import { ALLOWED_ORIGINS } from '@constants/globalConts.js';
import type { CorsOptions } from 'cors';

const getCorsConfig = (): CorsOptions => {
  const isProduction = process.env.NODE_ENV === 'production';

  const allowedOrigin = ALLOWED_ORIGINS.filter((origin): origin is string => origin !== undefined);

  return {
    origin: allowedOrigin,

    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
    credentials: true,

    maxAge: 86400,
  };
};

export default getCorsConfig;
