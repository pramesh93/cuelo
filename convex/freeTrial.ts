import {v} from 'convex/values';
import type {QueryCtx,MutationCtx} from './_generated/server';
import type {Doc,Id} from './_generated/dataModel';

export const FREE_CALLS=3;
export function allowedTrialCalls(record:Pick<Doc<'freeCallTrials'>,'developmentCallLimit'>|null,env:Record<string,string|undefined>=process.env){return env.CONVEX_CLOUD_URL==='https://calculating-gecko-263.convex.cloud'&&record?.developmentCallLimit===4?4:FREE_CALLS;}
export const FREE_LISTENING_MS=90*60*1000;
export const TRIAL_ENDED='Your free trial has ended. You’ve reached your three-call or 90-minute allowance. Paid plans are coming soon.';
export const trialValue=v.object({callsUsed:v.number(),callsRemaining:v.number(),listeningMs:v.number(),remainingMs:v.number(),exhausted:v.boolean()});
export async function trialRecord(ctx:QueryCtx,userId:Id<'users'>){return (await ctx.db.query('freeCallTrials').withIndex('by_user',q=>q.eq('userId',userId)).take(1))[0]??null;}
export function segmentMs(row:Doc<'liveCalls'>,now=Date.now()){
 if(row.trialSegmentAt==null)return 0;
 return Math.max(0,Math.min(now,row.deadline,row.expiresAt)-row.trialSegmentAt);
}
export async function accountTrial(ctx:QueryCtx,userId:Id<'users'>,now=Date.now()){
 const record=await trialRecord(ctx,userId);
 const active=record?.sessionId?await ctx.db.get(record.sessionId):null;
 const listeningMs=Math.min(FREE_LISTENING_MS,(record?.listeningMs??0)+(active&&active.userId===userId?segmentMs(active,now):0));
 const callsUsed=record?.callsUsed??0,remainingMs=Math.max(0,FREE_LISTENING_MS-listeningMs);
 return {callsUsed,callsRemaining:Math.max(0,allowedTrialCalls(record)-callsUsed),listeningMs,remainingMs,exhausted:callsUsed>=allowedTrialCalls(record)||remainingMs<=0};
}
// Persist time before Pause, Stop or expiry; the segment watermark makes repeats idempotent.
export async function settleTrial(ctx:MutationCtx,row:Doc<'liveCalls'>,now=Date.now()){
 if(!row.trialEnforced)return;
 const record=await trialRecord(ctx,row.userId);
 if(record&&record.sessionId===row._id){await ctx.db.patch(record._id,{listeningMs:Math.min(FREE_LISTENING_MS,record.listeningMs+segmentMs(row,now))});}
 await ctx.db.patch(row._id,{trialSegmentAt:null,...(row.analyticsEnabled?{listeningMs:(row.listeningMs??0)+segmentMs(row,now)}:{})});
}
