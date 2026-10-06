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
