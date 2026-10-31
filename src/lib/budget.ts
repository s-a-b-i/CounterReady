export interface BudgetInput {
  totalUnitsUsed: number;
  sessionTryons: number;
  cost: number;
  maxUnitsTotal: number;
  maxTryonsPerSession: number;
}

export type BudgetDecision =
  | { ok: true }
  | { ok: false; reason: "GLOBAL_CAP" | "SESSION_CAP"; message: string };

/** Pure decision function; the DB transaction in `reserveUnits` feeds it real numbers. */
export function evaluateBudget(i: BudgetInput): BudgetDecision {
  if (i.sessionTryons >= i.maxTryonsPerSession) {
    return {
      ok: false,
      reason: "SESSION_CAP",
      message: `You've used all ${i.maxTryonsPerSession} demo try-ons for this session. You can still browse, compare and decide.`,
    };
  }
  if (i.totalUnitsUsed + i.cost > i.maxUnitsTotal) {
    return {
      ok: false,
      reason: "GLOBAL_CAP",
      message: "The demo's try-on credit limit has been reached. Browse the catalogue and see pre-generated examples instead.",
    };
  }
  return { ok: true };
}
