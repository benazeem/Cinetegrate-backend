const ROLE = {
    USER: 'user',
    ADMIN: 'admin',
} as const;

 

export type Role = typeof ROLE[keyof typeof ROLE];
export { ROLE };

export const ACCOUNT_STATUSES = [
  "active", 
  "suspend",
  "deactive",
  "banned",
  "delete",
] as const;

export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];
