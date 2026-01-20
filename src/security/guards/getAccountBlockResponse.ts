import { AccountStatus } from "@constants/userConsts.js";
import { accountStatusResponses } from "../policies/accountStatusResponses.js";

export function getAccountBlockResponse(status: AccountStatus | null | undefined) {
  return accountStatusResponses(status);
}
