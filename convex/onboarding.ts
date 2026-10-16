import {v,ConvexError} from 'convex/values';
import {getAuthUserId} from '@convex-dev/auth/server';
import {mutation} from './_generated/server';
import type {QueryCtx} from './_generated/server';
export const guideStep=v.union(v.literal('install'),v.literal('content'),v.literal('call'));
export const contentMode=v.union(v.literal('generic'),v.literal('document'));
export const onboardingValue=v.object({detailsComplete:v.boolean(),role:v.union(v.string(),v.null()),company:v.union(v.string(),v.null()),step:guideStep,extensionSeen:v.boolean(),contentMode:v.union(contentMode,v.null())});
export async function onboardingRecord(ctx:QueryCtx,userId:import('./_generated/dataModel').Id<'users'>){return (await ctx.db.query('accountOnboarding').withIndex('by_user',q=>q.eq('userId',userId)).take(1))[0]??null;}
async function owned(ctx:QueryCtx){const user=await getAuthUserId(ctx);if(!user)throw new ConvexError('Sign in to set up Cuelo.');return user;}
export const saveDetails=mutation({args:{role:v.string(),company:v.string()},returns:v.null(),handler:async(ctx,args)=>{
 const userId=await owned(ctx);const role=args.role.trim(),company=args.company.trim();
 if(!role||role.length>120)throw new ConvexError('Enter your role using up to 120 characters.');
 if(!company||company.length>160)throw new ConvexError('Enter your company name using up to 160 characters.');
 const previous=await onboardingRecord(ctx,userId),now=Date.now();
 if(previous)await ctx.db.patch(previous._id,{role,company,updatedAt:now});
 else await ctx.db.insert('accountOnboarding',{userId,role,company,step:'install',extensionSeenAt:null,contentMode:null,createdAt:now,updatedAt:now});
 return null;
}});
export const advance=mutation({args:{step:guideStep,extensionSeen:v.optional(v.boolean()),contentMode:v.optional(contentMode)},returns:v.null(),handler:async(ctx,args)=>{
 const userId=await owned(ctx),row=await onboardingRecord(ctx,userId);if(!row)throw new ConvexError('Add your role and company before continuing.');
 const seen=row.extensionSeenAt!==null||args.extensionSeen===true;
 const mode=args.contentMode??row.contentMode;
 if(args.step!=='install'&&!seen)throw new ConvexError('Add the Chrome extension before continuing.');
 if(args.step==='call'&&!mode)throw new ConvexError('Choose general knowledge or your content before continuing.');
 if(args.step==='call'&&mode==='document'){
  const sources=await ctx.db.query('sources').withIndex('by_owner_saved',q=>q.eq('ownerKey',`user:${userId}`).eq('saved',true)).take(1);
  if(!sources.length)throw new ConvexError('Add content first, or choose general knowledge.');
 }
 await ctx.db.patch(row._id,{step:args.step,...(args.extensionSeen?{extensionSeenAt:row.extensionSeenAt??Date.now()}:{}),...(args.contentMode?{contentMode:args.contentMode}:{}),updatedAt:Date.now()});
 // Guide progress never marks a call complete or grants trial access.
 return null;
}});
