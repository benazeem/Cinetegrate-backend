// constants/accountStatus.ts
export const ACCOUNT_STATUSES = [
  "active",
  "suspended",
  "banned",
  "disabled",
  "deleted",
] as const;

export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];
