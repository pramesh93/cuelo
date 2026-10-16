import {liveCallConfig} from './liveCallPolicy';
import {accountTrial,trialValue} from './freeTrial';
import {getAuthUserId} from '@convex-dev/auth/server';
import {query} from './_generated/server';
import {v} from 'convex/values';
export const status=query({args:{},returns:v.object({signedIn:v.boolean(),googleConfigured:v.boolean(),liveEnabled:v.boolean(),trial:v.union(trialValue,v.null())}),handler:async ctx=>{
 const userId=await getAuthUserId(ctx);
 return {signedIn:!!userId,googleConfigured:!!process.env.AUTH_GOOGLE_ID&&!!process.env.AUTH_GOOGLE_SECRET,liveEnabled:!!liveCallConfig(),trial:userId?await accountTrial(ctx,userId):null};
}});
