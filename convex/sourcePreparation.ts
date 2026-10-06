"use node";
import {randomBytes} from "node:crypto";
import {action} from "./_generated/server";
import {api,internal} from "./_generated/api";
import {v} from "convex/values";
import {sourceTicketValue} from "./preparedSourceValues";
import {fetchSource} from "./evidence";
import type {Id} from "./_generated/dataModel";

export const prepare=action({
  args:{},returns:v.object({ticket:v.union(sourceTicketValue,v.null()),message:v.string()}),
  handler:async (ctx):Promise<{ticket:{id:Id<"preparedSources">;secret:string}|null;message:string}>=>{
    const ready=await ctx.runQuery(api.speechBudget.status,{});
    if(!ready.enabled) return {ticket:null,message:ready.message};
    const secret=randomBytes(32).toString("hex");
    const id=await ctx.runMutation(internal.preparedSources.start,{secret});
    if(!id) return {ticket:null,message:"Another question’s source is still loading. Try again shortly."};
    const ticket={id,secret};
    try {
      const source=await fetchSource();
      if(!await ctx.runMutation(internal.preparedSources.store,{ticket,source})) {
        await ctx.runMutation(api.preparedSources.discard,{ticket});
        return {ticket:null,message:"The prepared source expired. Speak your question again."};
      }
      return {ticket,message:""};
    } catch {
      await ctx.runMutation(api.preparedSources.discard,{ticket});
      return {ticket:null,message:"The Slack article could not be read within the source limits. Try again or check the original article."};
    }
  },
});
