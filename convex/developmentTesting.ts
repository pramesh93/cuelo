import {v} from 'convex/values';
import {internalMutation} from './_generated/server';
import {FREE_LISTENING_MS} from './freeTrial';
// One explicitly approved development retest. Absolute limit makes replay safe.
export const grantDevelopmentRetest=internalMutation({args:{trialId:v.id('freeCallTrials'),expectedCallsUsed:v.literal(3),expectedListeningMs:v.number()},returns:v.object({callsUsed:v.number(),callsRemaining:v.number(),listeningMs:v.number()}),handler:async(ctx,args)=>{
 if(process.env.CONVEX_CLOUD_URL!=='https://calculating-gecko-263.convex.cloud')throw Error('Development-only test allowance.');
 if(process.env.LIVE_CALL_TESTING_ENABLED==='true')throw Error('Disable listening before granting the reviewed test allowance.');
 const row=await ctx.db.get(args.trialId);if(!row||row.callsUsed!==args.expectedCallsUsed||row.listeningMs!==args.expectedListeningMs||row.sessionId!==null)throw Error('Account usage changed; review again.');
 if(row.listeningMs>=FREE_LISTENING_MS)throw Error('The listening-minute allowance is exhausted.');
 if(!await ctx.db.get(row.userId))throw Error('Account unavailable.');
 if(row.developmentCallLimit!==4)await ctx.db.patch(row._id,{developmentCallLimit:4});
 return {callsUsed:row.callsUsed,callsRemaining:1,listeningMs:row.listeningMs};
}});
