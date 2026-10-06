import {getAuthUserId} from "@convex-dev/auth/server";
import {v, ConvexError} from "convex/values";
import {query, mutation} from "./_generated/server";
import {normaliseMeetingLink} from "./meetingLink";

const mode = v.union(v.literal("generic"), v.literal("document"));
const setup = v.object({mode, meetingUrl: v.union(v.string(), v.null())});

export const get = query({
  args: {}, returns: v.union(setup, v.null()),
  handler: async ctx => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const row = (await ctx.db.query("callSetup").withIndex("by_user", q => q.eq("userId", userId)).take(1))[0];
    return row ? {mode: row.mode, meetingUrl: row.meetingUrl} : null;
  },
});

export const save = mutation({
  args: {mode, meetingUrl: v.string()}, returns: setup,
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Sign in with Google before saving your call setup.");
    let meetingUrl: string | null;
    try { meetingUrl = normaliseMeetingLink(args.meetingUrl); }
    catch (error) { throw new ConvexError(error instanceof Error ? error.message : "Use a valid Google Meet link."); }
    const row = (await ctx.db.query("callSetup").withIndex("by_user", q => q.eq("userId", userId)).take(1))[0];
    const values = {mode: args.mode, meetingUrl, updatedAt: Date.now()};
    if (row) await ctx.db.patch(row._id, values);
    else await ctx.db.insert("callSetup", {userId, ...values});
    // This saves a preference, not an active session or permission to capture audio.
    return {mode: args.mode, meetingUrl};
  },
});
