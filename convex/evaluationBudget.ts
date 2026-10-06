import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { answerAttemptLimit } from "./testingLimits";

// A small global development allowance, not a per-person product allowance.
// Every attempt reserves $0.10, including failures. No question or answer is saved.
export const reserve = internalMutation({
  args: {}, returns: v.boolean(),
  handler: async (ctx) => {
    if (process.env.EVALUATION_TESTING_ENABLED !== "true") return false;
    const row = await ctx.db.query("evaluationUsage").withIndex("by_scope", q => q.eq("scope", "milestone1")).take(1);
    const used = row[0];
    if ((used?.count ?? 0) >= answerAttemptLimit()) return false;
    if (used) await ctx.db.patch(used._id, {count: used.count + 1, reservedUsd: used.reservedUsd + 0.1});
    else await ctx.db.insert("evaluationUsage", {scope: "milestone1", count: 1, reservedUsd: 0.1});
    return true;
  },
});
