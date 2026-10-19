import {v} from 'convex/values';
import {internalMutation} from './_generated/server';
import {FREE_LISTENING_MS} from './freeTrial';
// One explicitly approved development retest. Absolute limit makes replay safe.
export const grantDevelopmentRetest=internalMutation({args:{trialId:v.id('freeCallTrials'),expectedCallsUsed:v.literal(3),expectedListeningMs:v.number()},returns:v.object({callsUsed:v.number(),callsRemaining:v.number(),listeningMs:v.number()}),handler:async(ctx,args)=>{
 if(process.env.CONVEX_CLOUD_URL!=='https://calculating-gecko-263.convex.cloud')throw Error('Development-only test allowance.');
 if(process.env.LIVE_CALL_TESTING_ENABLED==='true')throw Error('Disable listening before granting the reviewed test allowance.');
 const row=await ctx.db.get(args.trialId);if(!row||row.callsUsed!==args.expectedCallsUsed||row.listeningMs!==args.expectedListeningMs||row.sessionId!==null)throw Error('Account usage changed; review again.');
 if((row.trialTimeMs??row.listeningMs)>=FREE_LISTENING_MS)throw Error('The listening-minute allowance is exhausted.');
 if(!await ctx.db.get(row.userId))throw Error('Account unavailable.');
 if(row.developmentCallLimit!==4)await ctx.db.patch(row._id,{developmentCallLimit:4});
 return {callsUsed:row.callsUsed,callsRemaining:1,listeningMs:row.listeningMs};
}});
// Absolute, account-specific two-call grant approved on 17 October; no resets.
export const grantOctoberSearchTests=internalMutation({args:{trialId:v.id('freeCallTrials'),expectedCallsUsed:v.literal(4),expectedListeningMs:v.literal(723713)},returns:v.object({callsUsed:v.number(),callsRemaining:v.number(),listeningMs:v.number()}),handler:async(ctx,args)=>{
 if(process.env.CONVEX_CLOUD_URL!=='https://calculating-gecko-263.convex.cloud')throw Error('Development-only test allowance.');
 if(process.env.LIVE_CALL_TESTING_ENABLED==='true')throw Error('Disable listening before granting the reviewed test allowance.');
 const row=await ctx.db.get(args.trialId);if(!row||row.callsUsed!==args.expectedCallsUsed||row.listeningMs!==args.expectedListeningMs||row.sessionId!==null)throw Error('Account usage changed; review again.');
 if((row.trialTimeMs??row.listeningMs)>=FREE_LISTENING_MS||!await ctx.db.get(row.userId))throw Error('Account unavailable or minutes exhausted.');
 if(row.developmentCallLimit!==6)await ctx.db.patch(row._id,{developmentCallLimit:6});
 return {callsUsed:row.callsUsed,callsRemaining:2,listeningMs:row.listeningMs};
}});

// One reviewed website retest; global spending/usage history is never reset.
export const grantWebsiteRetest=internalMutation({args:{usageId:v.id('openingUsage')},returns:v.object({remaining:v.number(),alreadyGranted:v.boolean()}),handler:async(ctx,args)=>{
 if(process.env.CONVEX_CLOUD_URL!=='https://calculating-gecko-263.convex.cloud')throw Error('Development-only test allowance.');
 const row=await ctx.db.get(args.usageId);
 if(!row||row.day!=='2026-10-17'||Date.now()>=Date.parse('2026-10-17T18:30:00Z'))throw Error('Reviewed test day has changed.');
 if(row.developmentRetest)return {remaining:Math.max(0,3-row.attempts),alreadyGranted:true};
 if(row.attempts!==3||row.activeUntil>Date.now())throw Error('Browser use changed; review again.');
 await ctx.db.patch(row._id,{attempts:0,activeKey:null,activeUntil:0,developmentRetest:'2026-10-17'});
 return {remaining:3,alreadyGranted:false};
}});

// Second explicitly approved batch; preserve all global usage and spending holds.
export const grantWebsiteSecondRetest=internalMutation({args:{usageId:v.id('openingUsage')},returns:v.object({remaining:v.number(),alreadyGranted:v.boolean()}),handler:async(ctx,args)=>{
 if(process.env.CONVEX_CLOUD_URL!=='https://calculating-gecko-263.convex.cloud')throw Error('Development-only test allowance.');
 const row=await ctx.db.get(args.usageId);
 if(!row||row.day!=='2026-10-17'||Date.now()>=Date.parse('2026-10-17T18:30:00Z'))throw Error('Reviewed test day has changed.');
 if(row.developmentRetest==='2026-10-17-second')return {remaining:Math.max(0,3-row.attempts),alreadyGranted:true};
 if(row.developmentRetest!=='2026-10-17'||row.attempts!==2||row.activeUntil>Date.now())throw Error('Browser use changed; review again.');
 await ctx.db.patch(row._id,{attempts:0,activeKey:null,activeUntil:0,developmentRetest:'2026-10-17-second'});
 return {remaining:3,alreadyGranted:false};
}});

// Third explicitly approved batch after time-bounded shortening.
export const grantWebsiteThirdRetest=internalMutation({args:{usageId:v.id('openingUsage')},returns:v.object({remaining:v.number(),alreadyGranted:v.boolean()}),handler:async(ctx,args)=>{
 if(process.env.CONVEX_CLOUD_URL!=='https://calculating-gecko-263.convex.cloud')throw Error('Development-only test allowance.');
 const row=await ctx.db.get(args.usageId);
 if(!row||row.day!=='2026-10-17'||Date.now()>=Date.parse('2026-10-17T18:30:00Z'))throw Error('Reviewed test day has changed.');
 if(row.developmentRetest==='2026-10-17-third')return {remaining:Math.max(0,3-row.attempts),alreadyGranted:true};
 if(row.developmentRetest!=='2026-10-17-second'||row.attempts!==3||row.activeUntil>Date.now())throw Error('Browser use changed; review again.');
 await ctx.db.patch(row._id,{attempts:0,activeKey:null,activeUntil:0,developmentRetest:'2026-10-17-third'});
 return {remaining:3,alreadyGranted:false};
}});

// Approved three-question user check after the successful SSO diagnostic.
export const grantWebsiteFourthRetest=internalMutation({args:{usageId:v.id('openingUsage')},returns:v.object({remaining:v.number(),alreadyGranted:v.boolean()}),handler:async(ctx,args)=>{
 if(process.env.CONVEX_CLOUD_URL!=='https://calculating-gecko-263.convex.cloud')throw Error('Development-only test allowance.');
 const row=await ctx.db.get(args.usageId);
 if(!row||row.day!=='2026-10-17'||Date.now()>=Date.parse('2026-10-17T18:30:00Z'))throw Error('Reviewed test day has changed.');
 if(row.developmentRetest==='2026-10-17-fourth')return {remaining:Math.max(0,3-row.attempts),alreadyGranted:true};
 if(row.developmentRetest!=='2026-10-17-third'||row.attempts!==3||row.activeUntil>Date.now())throw Error('Browser use changed; review again.');
 await ctx.db.patch(row._id,{attempts:0,activeKey:null,activeUntil:0,developmentRetest:'2026-10-17-fourth'});
 return {remaining:3,alreadyGranted:false};
}});

// Three flow checks approved19 October. Existing usage and the90-minute limit remain.
export const grantOctoberFlowTests=internalMutation({args:{trialId:v.id('freeCallTrials'),expectedCallsUsed:v.literal(5),expectedListeningMs:v.number()},returns:v.object({callsUsed:v.number(),callsRemaining:v.number(),listeningMs:v.number()}),handler:async(ctx,args)=>{
 if(process.env.CONVEX_CLOUD_URL!=='https://calculating-gecko-263.convex.cloud'||process.env.CUELO_OCTOBER_FLOW_TESTS!=='2026-10-19'||!new Date().toISOString().startsWith('2026-10'))throw Error('Development-only October flow tests.');
 if(process.env.LIVE_CALL_TESTING_ENABLED==='true')throw Error('Disable listening before granting the reviewed test allowance.');
 const row=await ctx.db.get(args.trialId);
 if(!row||row.sessionId!==null||(row.trialTimeMs??row.listeningMs)>=FREE_LISTENING_MS||!await ctx.db.get(row.userId))throw Error('Account unavailable, active or minutes exhausted.');
 if(row.developmentCallLimit===8&&row.callsUsed>=5)return {callsUsed:row.callsUsed,callsRemaining:Math.max(0,8-row.callsUsed),listeningMs:row.listeningMs};
 if(row.callsUsed!==args.expectedCallsUsed||row.listeningMs!==args.expectedListeningMs||row.developmentCallLimit!==6)throw Error('Account usage changed; review again.');
 await ctx.db.patch(row._id,{developmentCallLimit:8});
 return {callsUsed:row.callsUsed,callsRemaining:3,listeningMs:row.listeningMs};
}});
