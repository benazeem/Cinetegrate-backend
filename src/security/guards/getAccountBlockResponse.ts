import { AccountStatus } from "@constants/userConts.js";
import { accountStatusResponses } from "../policies/accountStatusResponses.js";

export function getAccountBlockResponse(status: Partial<AccountStatus>) {
  return accountStatusResponses(status) || null;
}
