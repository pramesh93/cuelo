// Integer paise avoid floating-point errors. One rupee is 100 paise.
export const MONTHLY_BUDGET_PAISE = 500000;
export const SPENDING_HEADROOM_PAISE = 50000;
export const ALERT_THRESHOLD_PAISE = 400000;

// Approved 17 October: preserve historical holds, fund ₹1826 dev tests from unused
// production capacity/buffer, retain ₹1000 other services and ₹132 buffer.
export function octoberTestTransfer(env:Record<string,string|undefined>=process.env){return env.CUELO_TEST_BUDGET_TRANSFER==='2026-10-17'&&new Date().toISOString().startsWith('2026-10');}
// Approved development-only sidebar test: move ₹122 from the remaining buffer.
export function sidebarTestTransfer(env:Record<string,string|undefined>=process.env){return octoberTestTransfer(env)&&env.CONVEX_CLOUD_URL==='https://calculating-gecko-263.convex.cloud'&&env.CUELO_SIDEBAR_BUDGET_TRANSFER==='2026-10-17';}
export function octoberFlowTests(env:Record<string,string|undefined>=process.env){return env.CONVEX_CLOUD_URL==='https://calculating-gecko-263.convex.cloud'&&env.CUELO_OCTOBER_FLOW_TESTS==='2026-10-19'&&new Date().toISOString().startsWith('2026-10');}
export function monthlyBudget(env:Record<string,string|undefined>=process.env){return octoberFlowTests(env)?800000:MONTHLY_BUDGET_PAISE;}
export function spendingAlertThreshold(env:Record<string,string|undefined>=process.env){return Math.floor(monthlyBudget(env)*.8);}
export function callAnswerPoolPaise(answerLimit:number,env:Record<string,string|undefined>=process.env){return env.LIVE_CALL_ANSWER_BUDGET_ENABLED==='true'?(answerLimit>0?answerLimit:4)*7100:0;}
export function spendingHeadroom(env:Record<string,string|undefined>=process.env){return octoberFlowTests(env)?1000:octoberTestTransfer(env)?(sidebarTestTransfer(env)?1000:13200):SPENDING_HEADROOM_PAISE;}
export function allocationLimit(env:Record<string,string|undefined>=process.env){
 if(octoberFlowTests(env))return 644800;
 if(env.CONVEX_CLOUD_URL==='https://calculating-gecko-263.convex.cloud')return octoberTestTransfer(env)?(sidebarTestTransfer(env)?344800:332600):150000;
 if(env.CONVEX_CLOUD_URL==='https://deafening-frog-846.convex.cloud')return octoberTestTransfer(env)?54200:200000;
 return MONTHLY_BUDGET_PAISE-SPENDING_HEADROOM_PAISE;
}

export function budgetDecision(reservedPaise: number, amountPaise: number, limit=allocationLimit()) {
  if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0 || amountPaise > monthlyBudget()) {
    throw new Error("A spending reservation must be a positive whole number of paise within the monthly budget.");
  }
  if (!Number.isSafeInteger(reservedPaise) || reservedPaise < 0) throw new Error("Invalid spending ledger.");
  const next = reservedPaise + amountPaise;
  return {
    allowed: next <= limit,
    alert: next >= Math.min(spendingAlertThreshold(),Math.floor(limit*.8)),
  };
}

export function spendingMonth(now: number) {
  // The monthly ledger is explicitly UTC, shared across every account/service.
  return new Date(now).toISOString().slice(0, 7);
}
