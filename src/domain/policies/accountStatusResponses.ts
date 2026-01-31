import { AccountStatus } from "@constants/userConsts.js";

export type AccountBlockStatusResponse = {
  httpStatus: number;
  error: string;
  reason: string;
  message: string;
  nextStep: string;
};

export const accountStatusResponses = (status: AccountStatus | null | undefined) => {
  switch (status) {
    case "deactive":
      return {
        httpStatus: 403,
        error: "ACCOUNT_INACTIVE",
        reason: "DEACTIVATED",
        message: "Your account is currently deactivated.",
        nextStep: "REACTIVATE"
      };
    case "suspend":
      return {
        httpStatus: 403,
        error: "ACCOUNT_BLOCKED",
        reason: "SUSPENDED",
        message: "Your account has been temporarily restricted.",
        nextStep: "CONTACT_SUPPORT"
      };
    case "banned":
      return {
        httpStatus: 403,
        error: "ACCOUNT_BLOCKED",
        reason: "BANNED",
        message: "Your account is no longer allowed to access this service.",
        nextStep: "CONTACT_SUPPORT"
      };
    case "delete":
      return {
        httpStatus: 403,
        error: "ACCOUNT_REMOVED",
        reason: "DELETED",
        message: "This account has been removed.",
        nextStep: "RECOVER_OR_REGISTER"
      };
    default:
      return null;
  }
};