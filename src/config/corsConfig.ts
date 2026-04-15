import { ALLOWED_ORIGINS } from '@constants/globalConts.js';
import type { CorsOptions } from 'cors';

const getCorsConfig = (): CorsOptions => {
  const allowedOrigin = ALLOWED_ORIGINS.filter((origin): origin is string => origin !== undefined);

  return {
    origin: (origin, callback) => {
      if (!origin || allowedOrigin.includes(origin)) {
        callback(null, true);
      } else {
        console.warn('Blocked by CORS:', origin);
        return callback(null, false);
      }
    },

    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
    credentials: true,

    maxAge: 86400,
  };
};

export default getCorsConfig;
