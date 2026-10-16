// Integer paise avoid floating-point errors. One rupee is 100 paise.
export const MONTHLY_BUDGET_PAISE = 500000;
export const SPENDING_HEADROOM_PAISE = 50000;
export const ALERT_THRESHOLD_PAISE = 400000;

export function allocationLimit(env:Record<string,string|undefined>=process.env){
 if(env.CONVEX_CLOUD_URL==='https://calculating-gecko-263.convex.cloud')return 150000;
 if(env.CONVEX_CLOUD_URL==='https://deafening-frog-846.convex.cloud')return 200000;
 return MONTHLY_BUDGET_PAISE-SPENDING_HEADROOM_PAISE;
}

export function budgetDecision(reservedPaise: number, amountPaise: number, limit=MONTHLY_BUDGET_PAISE-SPENDING_HEADROOM_PAISE) {
  if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0 || amountPaise > MONTHLY_BUDGET_PAISE) {
    throw new Error("A spending reservation must be a positive whole number of paise within the monthly budget.");
  }
  if (!Number.isSafeInteger(reservedPaise) || reservedPaise < 0) throw new Error("Invalid spending ledger.");
  const next = reservedPaise + amountPaise;
  return {
    allowed: next <= limit,
    alert: next >= Math.min(ALERT_THRESHOLD_PAISE,Math.floor(limit*.8)),
  };
}

export function spendingMonth(now: number) {
  // The monthly ledger is explicitly UTC, shared across every account/service.
  return new Date(now).toISOString().slice(0, 7);
}
