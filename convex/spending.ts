import {v} from "convex/values";
import {internalMutation, internalQuery} from "./_generated/server";
import {ALERT_THRESHOLD_PAISE, budgetDecision, MONTHLY_BUDGET_PAISE, SPENDING_HEADROOM_PAISE, spendingMonth} from "./spendingPolicy";

const purpose = v.union(v.literal("opening"), v.literal("practice"), v.literal("live"));

// Internal only: the browser cannot choose its own cost or grant an allowance.
// Actual provider work must call this BEFORE spending. Until those routes are
// connected and an explicit test allowance is agreed, keep this feature off.
export const reserve = internalMutation({
  args: {key: v.string(), purpose, amountPaise: v.number()},
  returns: v.object({status: v.union(v.literal("reserved"), v.literal("disabled"), v.literal("exhausted")), alert: v.boolean()}),
  handler: async (ctx, args) => {
    if (process.env.V1_PAID_TESTING_ENABLED !== "true") return {status: "disabled" as const, alert: false};
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(args.key)) throw new Error("Invalid spending reservation key.");
    budgetDecision(0, args.amountPaise);
    const prior = (await ctx.db.query("spendingReservations").withIndex("by_key", q => q.eq("key", args.key)).take(1))[0];
    if (prior) {
      if (prior.purpose !== args.purpose || prior.amountPaise !== args.amountPaise) throw new Error("A spending reservation cannot be reused for another operation.");
      const ledger = (await ctx.db.query("spendingMonths").withIndex("by_month", q => q.eq("month", prior.month)).take(1))[0];
      return {status: "reserved" as const, alert: (ledger?.reservedPaise ?? 0) >= ALERT_THRESHOLD_PAISE};
    }
    const month = spendingMonth(Date.now());
    const row = (await ctx.db.query("spendingMonths").withIndex("by_month", q => q.eq("month", month)).take(1))[0];
    const decision = budgetDecision(row?.reservedPaise ?? 0, args.amountPaise);
    if (!decision.allowed) return {status: "exhausted" as const, alert: true};
    const values = {reservedPaise: (row?.reservedPaise ?? 0) + args.amountPaise, reservations: (row?.reservations ?? 0) + 1};
    if (row) await ctx.db.patch(row._id, values);
    else await ctx.db.insert("spendingMonths", {month, ...values});
    await ctx.db.insert("spendingReservations", {key: args.key, month, purpose: args.purpose, amountPaise: args.amountPaise});
    // Failed requests keep their reservation. No speculative refunds while
    // provider charges, retries and delayed billing are not reconciled.
    return {status: "reserved" as const, alert: decision.alert};
  },
});

export const snapshot = internalQuery({
  args: {}, returns: v.object({enabled: v.boolean(), month: v.string(), budgetPaise: v.number(), reservedPaise: v.number(), headroomPaise: v.number(), availablePaise: v.number(), alert: v.boolean()}),
  handler: async ctx => {
    const month = spendingMonth(Date.now());
    const row = (await ctx.db.query("spendingMonths").withIndex("by_month", q => q.eq("month", month)).take(1))[0];
    const reservedPaise = row?.reservedPaise ?? 0;
    return {enabled: process.env.V1_PAID_TESTING_ENABLED === "true", month, budgetPaise: MONTHLY_BUDGET_PAISE, reservedPaise, headroomPaise: SPENDING_HEADROOM_PAISE,
      availablePaise: Math.max(0, MONTHLY_BUDGET_PAISE - SPENDING_HEADROOM_PAISE - reservedPaise), alert: reservedPaise >= ALERT_THRESHOLD_PAISE};
  },
});

// One reviewed reconciliation per month, development only. Original reservation
// entries remain immutable. Retained money is a conservative hold, NOT an invoice.
const reconciliationArgs={month:v.string(),confirmedThrough:v.number(),retainedPaise:v.number(),openAiUsdMicros:v.number(),deepgramUsdMicros:v.number(),callsStoppedConfirmed:v.literal(true)};
const reconciliationView=v.object({beforePaise:v.number(),closedCalls:v.number(),closedHeldPaise:v.number(),retainedPaise:v.number(),releasePaise:v.number(),afterPaise:v.number()});
function validateReconciliation(args:{month:string;confirmedThrough:number;retainedPaise:number;openAiUsdMicros:number;deepgramUsdMicros:number}){
 if(process.env.CONVEX_CLOUD_URL!=='https://calculating-gecko-263.convex.cloud')throw Error('Reconciliation is restricted to the approved test deployment.');
 if(!/^\d{4}-\d{2}$/.test(args.month)||!Number.isSafeInteger(args.confirmedThrough)||spendingMonth(args.confirmedThrough)!==args.month||args.confirmedThrough>Date.now())throw Error('Use the exact month and cutoff covered by the provider reports.');
 for(const value of [args.retainedPaise,args.openAiUsdMicros,args.deepgramUsdMicros])if(!Number.isSafeInteger(value)||value<0)throw Error('Use nonnegative whole-number accounting amounts.');
 // This narrow review covers the reported sub-dollar test usage only. Larger
 // reports need a new cost review, rather than silently reusing this allowance.
 if(args.openAiUsdMicros+args.deepgramUsdMicros>1000000||args.retainedPaise<10000)throw Error('This review requires sub-dollar reported usage and at least ₹100 retained.');
}
async function reconciliationPreview(ctx:import('./_generated/server').QueryCtx,args:{month:string;confirmedThrough:number;retainedPaise:number;openAiUsdMicros:number;deepgramUsdMicros:number}){
 validateReconciliation(args);
 const prior=(await ctx.db.query('spendingReconciliations').withIndex('by_month',q=>q.eq('month',args.month)).take(1))[0];if(prior)throw Error('This month was already reconciled; another review is required.');
 const ledger=(await ctx.db.query('spendingMonths').withIndex('by_month',q=>q.eq('month',args.month)).take(1))[0];if(!ledger)throw Error('No spending ledger exists for that month.');
 const rows=await ctx.db.query('spendingReservations').withIndex('by_month_purpose',q=>q.eq('month',args.month).eq('purpose','live')).take(101);if(rows.length>100)throw Error('Too many reservations for this bounded test review.');
 const closed:typeof rows=[];
 for(const row of rows){
  if(row._creationTime>args.confirmedThrough||!row.key.startsWith('live-'))continue;
  const callId=ctx.db.normalizeId('liveCalls',row.key.slice(5));
  // Unknown references and every call row, even paused/expired, keep their hold.
  if(!callId||await ctx.db.get(callId))continue;
  if(!Number.isSafeInteger(row.amountPaise)||row.amountPaise<=0)throw Error('Invalid reservation; review the ledger manually.');
  closed.push(row);
 }
 const closedHeldPaise=closed.reduce((sum,row)=>sum+row.amountPaise,0);
 if(!Number.isSafeInteger(ledger.reservedPaise)||ledger.reservedPaise<closedHeldPaise)throw Error('Reservation totals do not match the ledger; no adjustment made.');
 const releasePaise=Math.max(0,closedHeldPaise-args.retainedPaise);
 return {ledger,ids:closed.map(row=>row._id),view:{beforePaise:ledger.reservedPaise,closedCalls:closed.length,closedHeldPaise,retainedPaise:args.retainedPaise,releasePaise,afterPaise:ledger.reservedPaise-releasePaise}};
}
export const previewTestReconciliation=internalQuery({args:reconciliationArgs,returns:reconciliationView,handler:async(ctx,args)=>(await reconciliationPreview(ctx,args)).view});
export const applyTestReconciliation=internalMutation({args:{...reconciliationArgs,expectedBeforePaise:v.number(),expectedReleasePaise:v.number()},returns:reconciliationView,handler:async(ctx,args)=>{
 validateReconciliation(args);
 const prior=(await ctx.db.query('spendingReconciliations').withIndex('by_month',q=>q.eq('month',args.month)).take(1))[0];
 if(prior){
  if(prior.confirmedThrough!==args.confirmedThrough||prior.retainedPaise!==args.retainedPaise||prior.openAiUsdMicros!==args.openAiUsdMicros||prior.deepgramUsdMicros!==args.deepgramUsdMicros||prior.beforePaise!==args.expectedBeforePaise||prior.releasePaise!==args.expectedReleasePaise)throw Error('This month was already reconciled with different details.');
  return {beforePaise:prior.beforePaise,closedCalls:prior.reservationIds.length,closedHeldPaise:prior.releasePaise+prior.retainedPaise,retainedPaise:prior.retainedPaise,releasePaise:prior.releasePaise,afterPaise:prior.afterPaise};
 }
 const preview=await reconciliationPreview(ctx,args);
 if(preview.view.beforePaise!==args.expectedBeforePaise||preview.view.releasePaise!==args.expectedReleasePaise)throw Error('The ledger changed since review. Preview again before applying.');
 if(!preview.view.releasePaise)throw Error('No unused closed-call reservation is available to release.');
 await ctx.db.insert('spendingReconciliations',{month:args.month,confirmedThrough:args.confirmedThrough,openAiUsdMicros:args.openAiUsdMicros,deepgramUsdMicros:args.deepgramUsdMicros,retainedPaise:args.retainedPaise,beforePaise:preview.view.beforePaise,releasePaise:preview.view.releasePaise,afterPaise:preview.view.afterPaise,reservationIds:preview.ids,createdAt:Date.now()});
 await ctx.db.patch(preview.ledger._id,{reservedPaise:preview.view.afterPaise});
 return preview.view;
}});
