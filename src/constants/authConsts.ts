// constants/accountStatus.ts
export const ACCOUNT_STATUSES = [
  "active",
  "inactive",
  "suspend",
  "deactive",
  "banned",
  "delete",
] as const;

export const RESET_EXP_MIN = Number(
  process.env.PASSWORD_RESET_EXPIRES_MIN || 10
);

export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];
