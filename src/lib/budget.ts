export interface BudgetInput {
  totalUnitsUsed: number;
  sessionPreviews: number;
  cost: number;
  maxUnitsTotal: number;
  maxPreviewsPerSession: number;
}

export type BudgetDecision =
  | { ok: true }
  | { ok: false; reason: "GLOBAL_CAP" | "SESSION_CAP"; message: string };

/** Pure decision function; the DB transaction in `reserveUnits` feeds it real numbers. */
export function evaluateBudget(i: BudgetInput): BudgetDecision {
  if (i.sessionPreviews >= i.maxPreviewsPerSession) {
    return {
      ok: false,
      reason: "SESSION_CAP",
      message: `You've used all ${i.maxPreviewsPerSession} demo previews for this session. You can still compare what you have and save your purchase card.`,
    };
  }
  if (i.totalUnitsUsed + i.cost > i.maxUnitsTotal) {
    return {
      ok: false,
      reason: "GLOBAL_CAP",
      message: "The demo's preview credit limit has been reached. The sample photo still works, because its results are saved.",
    };
  }
  return { ok: true };
}
