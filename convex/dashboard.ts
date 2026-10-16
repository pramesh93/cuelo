import {v,ConvexError} from 'convex/values';
import {getAuthUserId} from '@convex-dev/auth/server';
import {query} from './_generated/server';
import type {MutationCtx} from './_generated/server';
import type {Doc} from './_generated/dataModel';
import {onboardingRecord,onboardingValue} from './onboarding';
import {liveCallConfig} from './liveCallPolicy';
import {accountTrial,trialRecord,trialValue} from './freeTrial';

export async function recordEndedCall(ctx:MutationCtx,row:Doc<'liveCalls'>){
 if(!row.analyticsEnabled||!row.trialCounted)return;
 const values={listeningMs:row.listeningMs??0,answers:row.completedAnswers??0};
 // Only aggregate numbers and dates survive session deletion. No content or meeting URL.
 await ctx.db.insert('callRecords',{userId:row.userId,startedAt:row._creationTime,endedAt:Math.min(Date.now(),row.deadline,row.expiresAt),...values});
 const previous=(await ctx.db.query('accountMetrics').withIndex('by_user',q=>q.eq('userId',row.userId)).take(1))[0];
 if(previous)await ctx.db.patch(previous._id,{calls:previous.calls+1,listeningMs:previous.listeningMs+values.listeningMs,answers:previous.answers+values.answers});
 else await ctx.db.insert('accountMetrics',{userId:row.userId,calls:1,...values});
}
export const overview=query({args:{},returns:v.object({onboarding:onboardingValue,analyticsUnlocked:v.boolean(),listeningAvailable:v.boolean(),callState:v.union(v.literal('idle'),v.literal('active'),v.literal('paused')),profile:v.object({name:v.string(),email:v.string()}),totals:v.object({calls:v.number(),listeningMs:v.number(),answers:v.number()}),trial:trialValue,recentCalls:v.array(v.object({id:v.id('callRecords'),startedAt:v.number(),endedAt:v.number(),listeningMs:v.number(),answers:v.number()}))}),handler:async ctx=>{
 const userId=await getAuthUserId(ctx);if(!userId)throw new ConvexError('Sign in to view your home.');
 const user=await ctx.db.get(userId);const totals=(await ctx.db.query('accountMetrics').withIndex('by_user',q=>q.eq('userId',userId)).take(1))[0];
 const records=await ctx.db.query('callRecords').withIndex('by_user',q=>q.eq('userId',userId)).order('desc').take(5);
 const setup=await onboardingRecord(ctx,userId);const usage=await trialRecord(ctx,userId);const active=usage?.sessionId?await ctx.db.get(usage.sessionId):null;
 const callState: 'idle'|'active'|'paused'=active&&active.userId===userId&&active.trialCounted&&active.expiresAt>Date.now()&&active.deadline>Date.now()?active.state:'idle';
 const analyticsUnlocked=(totals?.calls??0)>0||records.length>0;
 return {onboarding:{detailsComplete:!!setup,role:setup?.role??null,company:setup?.company??null,step:setup?.step??'install',extensionSeen:setup?.extensionSeenAt!=null,contentMode:setup?.contentMode??null},analyticsUnlocked,listeningAvailable:!!liveCallConfig(),callState,profile:{name:user?.name??'Cuelo user',email:user?.email??''},totals:{calls:totals?.calls??0,listeningMs:totals?.listeningMs??0,answers:totals?.answers??0},trial:await accountTrial(ctx,userId),recentCalls:records.map(r=>({id:r._id,startedAt:r.startedAt,endedAt:r.endedAt,listeningMs:r.listeningMs,answers:r.answers}))};
}});
