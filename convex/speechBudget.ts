import {internalMutation, query} from "./_generated/server";
import {v} from "convex/values";

// One small evaluation pool per deployment. Failures count; no automatic retry.
const MAX_ATTEMPTS = 10;
const RESERVATION_USD = 0.01;
const LEASE_MS = 60000;
const state = v.union(v.literal("ready"), v.literal("busy"), v.literal("exhausted"), v.literal("disabled"), v.literal("answers_exhausted"));
export const status = query({
  args: {}, returns: v.object({enabled: v.boolean(), message: v.string()}),
  handler: async ctx => {
    if (!process.env.DEEPGRAM_API_KEY || process.env.SPEECH_TESTING_ENABLED !== "true") {
      return {enabled:false, message:"Speech testing is not enabled yet. Add the Deepgram key and enable speech testing in Convex."};
    }
    if (!process.env.OPENAI_API_KEY || process.env.EVALUATION_TESTING_ENABLED !== "true") {
      return {enabled:false, message:"Answers are not enabled yet. Enable evaluation testing in Convex before speaking."};
    }
    const row = (await ctx.db.query("speechUsage").withIndex("by_scope",q=>q.eq("scope","mic-evaluation")).take(1))[0];
    const answers = (await ctx.db.query("evaluationUsage").withIndex("by_scope",q=>q.eq("scope","milestone1")).take(1))[0];
    if ((answers?.count ?? 0) >= 10) return {enabled:false,message:"The answer testing allowance is used up. Paid requests have stopped."};
    if ((row?.count ?? 0) >= MAX_ATTEMPTS) return {enabled:false,message:"The speech testing allowance is used up. Paid requests have stopped."};
    if (row && row.activeUntil > Date.now()) return {enabled:false,message:"Another question is being transcribed. Try again shortly."};
    return {enabled:true,message:""};
  },
});

export const reserve = internalMutation({
  args: {lease: v.string()}, returns: state,
  handler: async (ctx,args) => {
    if (!process.env.DEEPGRAM_API_KEY || process.env.SPEECH_TESTING_ENABLED !== "true" || !process.env.OPENAI_API_KEY || process.env.EVALUATION_TESTING_ENABLED !== "true") return "disabled" as const;
    const answers = (await ctx.db.query("evaluationUsage").withIndex("by_scope",q=>q.eq("scope","milestone1")).take(1))[0];
    if ((answers?.count ?? 0) >= 10) return "answers_exhausted" as const;
    const row = (await ctx.db.query("speechUsage").withIndex("by_scope",q=>q.eq("scope","mic-evaluation")).take(1))[0];
    if ((row?.count ?? 0) >= MAX_ATTEMPTS) return "exhausted" as const;
    if (row && row.activeUntil > Date.now()) return "busy" as const;
    const update = {count:(row?.count ?? 0)+1, reservedUsd:(row?.reservedUsd ?? 0)+RESERVATION_USD, activeLease:args.lease, activeUntil:Date.now()+LEASE_MS};
    if (row) await ctx.db.patch(row._id,update);
    else await ctx.db.insert("speechUsage",{scope:"mic-evaluation",...update});
    return "ready" as const;
  },
});

export const release = internalMutation({
  args: {lease:v.string()}, returns:v.null(),
  handler: async (ctx,args) => {
    const row = (await ctx.db.query("speechUsage").withIndex("by_scope",q=>q.eq("scope","mic-evaluation")).take(1))[0];
    if (row?.activeLease === args.lease) await ctx.db.patch(row._id,{activeLease:null,activeUntil:0});
    return null;
  },
});
