import { ActionType, CREDIT_PRICING } from 'config/creditPricing.js';

export function getCreditCost(action: ActionType, grade: number): number {
  const cost = CREDIT_PRICING[action]?.[grade];
  if (cost === undefined) {
    throw new Error(`No pricing for ${action} grade ${grade}`);
  }
  return cost;
}
