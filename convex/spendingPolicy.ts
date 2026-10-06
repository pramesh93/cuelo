// Integer paise avoid floating-point errors. One rupee is 100 paise.
export const MONTHLY_BUDGET_PAISE = 500000;
export const SPENDING_HEADROOM_PAISE = 50000;
export const ALERT_THRESHOLD_PAISE = 400000;

export function budgetDecision(reservedPaise: number, amountPaise: number) {
  if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0 || amountPaise > MONTHLY_BUDGET_PAISE) {
    throw new Error("A spending reservation must be a positive whole number of paise within the monthly budget.");
  }
  if (!Number.isSafeInteger(reservedPaise) || reservedPaise < 0) throw new Error("Invalid spending ledger.");
  const next = reservedPaise + amountPaise;
  return {
    allowed: next <= MONTHLY_BUDGET_PAISE - SPENDING_HEADROOM_PAISE,
    alert: next >= ALERT_THRESHOLD_PAISE,
  };
}

export function spendingMonth(now: number) {
  // The monthly ledger is explicitly UTC, shared across every account/service.
  return new Date(now).toISOString().slice(0, 7);
}
