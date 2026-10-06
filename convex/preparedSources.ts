import {internalMutation,mutation} from "./_generated/server";
import {internal} from "./_generated/api";
import {v} from "convex/values";
import {sourceTicketValue,sourceValue} from "./preparedSourceValues";

const TTL_MS=120000;
export const start=internalMutation({
  args:{secret:v.string()},returns:v.union(v.id("preparedSources"),v.null()),
  handler:async(ctx,args)=>{
    // Match this evaluation's single-in-flight speech capacity. No unbounded preparation pool.
    const existing=await ctx.db.query("preparedSources").withIndex("by_expiry",q=>q.gt("expiresAt",Date.now())).take(1);
    if(existing.length) return null;
    const id=await ctx.db.insert("preparedSources",{secret:args.secret,expiresAt:Date.now()+TTL_MS,source:null});
    await ctx.scheduler.runAfter(TTL_MS,internal.preparedSources.expire,{id});
    return id;
  },
});
export const store=internalMutation({
  args:{ticket:sourceTicketValue,source:sourceValue},returns:v.boolean(),
  handler:async(ctx,args)=>{
    const row=await ctx.db.get(args.ticket.id);
    if(!row || row.secret!==args.ticket.secret || row.expiresAt<=Date.now()) return false;
    const url=new URL(args.source.url);
    if(url.origin!=="https://slack.com" || url.username || url.password || url.search || url.hash || !/^\/(?:intl\/en-[a-z]{2}\/)?help\/articles\/203772216-(?:SAML-single-sign-on|Set-up-SAML-single-sign-on-for-Slack)$/.test(url.pathname)) return false;
    if(!args.source.passages.length || args.source.passages.map(p=>p.text).join(" ").length>24000) return false;
    await ctx.db.patch(row._id,{source:args.source});
    return true;
  },
});
export const consume=internalMutation({
  args:{ticket:sourceTicketValue},returns:v.union(sourceValue,v.null()),
  handler:async(ctx,args)=>{
    const row=await ctx.db.get(args.ticket.id);
    if(!row || row.secret!==args.ticket.secret) return null;
    if(row.expiresAt<=Date.now()) {await ctx.db.delete(row._id);return null;}
    if(!row.source) return null;
    await ctx.db.delete(row._id); // One question only; no reuse in a later session.
    return row.source;
  },
});
export const discard=mutation({
  args:{ticket:sourceTicketValue},returns:v.null(),
  handler:async(ctx,args)=>{
    const row=await ctx.db.get(args.ticket.id);
    if(row?.secret===args.ticket.secret) await ctx.db.delete(row._id);
    return null;
  },
});
export const expire=internalMutation({
  args:{id:v.id("preparedSources")},returns:v.null(),
  handler:async(ctx,args)=>{
    const row=await ctx.db.get(args.id);
    if(row && row.expiresAt<=Date.now()) await ctx.db.delete(row._id);
    return null;
  },
});
