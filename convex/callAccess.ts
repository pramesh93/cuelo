import {liveCallConfig} from './liveCallPolicy';
import {getAuthUserId} from "@convex-dev/auth/server";
import {query,internalMutation} from "./_generated/server";
import {v} from "convex/values";

export const status=query({
  args:{},returns:v.object({signedIn:v.boolean(),invited:v.boolean(),googleConfigured:v.boolean(),liveEnabled:v.boolean()}),
  handler:async ctx=>{
    const userId=await getAuthUserId(ctx);
    const access=userId ? (await ctx.db.query("testerAccess").withIndex("by_user",q=>q.eq("userId",userId)).take(1))[0] : null;
    return {signedIn:!!userId,invited:access?.enabled===true,googleConfigured:!!process.env.AUTH_GOOGLE_ID && !!process.env.AUTH_GOOGLE_SECRET,
      // No paid live capture until the enforceable audio route and budget are approved.
      liveEnabled:!!liveCallConfig()};
  },
});

// CLI/backend administrators only; visitors cannot invite themselves.
export const setTesterAccess=internalMutation({
  args:{userId:v.id("users"),enabled:v.boolean()},returns:v.null(),
  handler:async(ctx,args)=>{
    if(!await ctx.db.get(args.userId)) throw new Error("Account not found.");
    const row=(await ctx.db.query("testerAccess").withIndex("by_user",q=>q.eq("userId",args.userId)).take(1))[0];
    if(row) await ctx.db.patch(row._id,{enabled:args.enabled});
    else await ctx.db.insert("testerAccess",args);
    return null;
  },
});
