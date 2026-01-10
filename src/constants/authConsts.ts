// constants/accountStatus.ts 
export  { ACCOUNT_STATUSES, type AccountStatus } from './userConts.js';

export const RESET_EXP_MIN = Number(
  process.env.PASSWORD_RESET_EXPIRES_MIN || 10
);

