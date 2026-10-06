import {v,ConvexError} from 'convex/values';
import {getAuthUserId} from '@convex-dev/auth/server';
import {query,mutation,internalQuery,internalMutation} from './_generated/server';
import type {QueryCtx,MutationCtx} from './_generated/server';
import type {Doc} from './_generated/dataModel';
import {sourceScopeArgs,sourceMetaValue,sourceContentValue,expectedSource,passageValue} from './sourceValues';
import {validateContent} from './sourceLimits';

export async function ownerKey(ctx:Pick<QueryCtx,'auth'>,guestSecret?:string) {
 if(guestSecret!==undefined){if(!/^[a-f0-9]{64}$/.test(guestSecret))throw new ConvexError('Your temporary source session is invalid. Reload the page.');const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(guestSecret));return `guest:${Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('')}`;}
 const user=await getAuthUserId(ctx);if(!user)throw new ConvexError('Sign in with Google to manage a saved source.');return `user:${user}`;
}
async function current(ctx:QueryCtx,key:string) {return (await ctx.db.query('sources').withIndex('by_owner',q=>q.eq('ownerKey',key)).take(1))[0]??null;}
function active(row:Doc<'sources'>|null) {return row&&(row.expiresAt===null||row.expiresAt>Date.now())?row:null;}
function meta(row:Doc<'sources'>) {return {id:row._id,title:row.title,kind:row.kind,url:row.url,pageCount:row.pageCount,passageCount:row.passageCount,saved:row.saved,expiresAt:row.expiresAt};}
async function erase(ctx:MutationCtx,row:Doc<'sources'>) {
 const passages=await ctx.db.query('sourcePassages').withIndex('by_source',q=>q.eq('sourceId',row._id)).take(501);
 for(const passage of passages)await ctx.db.delete(passage._id);await ctx.db.delete(row._id);
}
export const get=query({args:sourceScopeArgs,returns:v.union(sourceMetaValue,v.null()),handler:async(ctx,args)=>{const row=active(await current(ctx,await ownerKey(ctx,args.guestSecret)));return row?meta(row):null;}});
export const passages=query({args:{...sourceScopeArgs,id:v.id('sources')},returns:v.array(passageValue),handler:async(ctx,args)=>{
 const row=active(await current(ctx,await ownerKey(ctx,args.guestSecret)));if(!row||row._id!==args.id)throw new ConvexError('This source is unavailable. Add or confirm your source again.');
 return (await ctx.db.query('sourcePassages').withIndex('by_source',q=>q.eq('sourceId',row._id)).take(501)).map(p=>({ordinal:p.ordinal,reference:p.reference,text:p.text}));
}});
export const remove=mutation({args:{...sourceScopeArgs,expectedId:expectedSource},returns:v.null(),handler:async(ctx,args)=>{
 const row=await current(ctx,await ownerKey(ctx,args.guestSecret));if(!row)return null;
 if(row._id!==args.expectedId)throw new ConvexError('Your source changed in another window. Refresh before deleting.');await erase(ctx,row);return null;
}});
export const check=internalQuery({args:sourceScopeArgs,returns:v.string(),handler:async(ctx,args)=>ownerKey(ctx,args.guestSecret)});
export const admit=internalMutation({args:sourceScopeArgs,returns:v.string(),handler:async(ctx,args)=>{
 const key=await ownerKey(ctx,args.guestSecret);
 if(process.env.SOURCE_MANAGEMENT_ENABLED!=='true')throw new ConvexError('Source setup is not enabled yet.');
 // A development load guard, not an AI allowance or person-identification promise.
 const row=(await ctx.db.query('sourceAdmission').withIndex('by_scope',q=>q.eq('scope','sources')).take(1))[0];const now=Date.now();
 if(row&&now-row.windowStart<3600000&&row.attempts>=60)throw new ConvexError('Source setup is busy right now. Try again in an hour.');
 const values={windowStart:row&&now-row.windowStart<3600000?row.windowStart:now,attempts:row&&now-row.windowStart<3600000?row.attempts+1:1};
 if(row)await ctx.db.patch(row._id,values);else await ctx.db.insert('sourceAdmission',{scope:'sources',...values});return key;
}});
export const put=internalMutation({args:{...sourceScopeArgs,ownerKey:v.optional(v.string()),expectedId:expectedSource,content:sourceContentValue},returns:sourceMetaValue,handler:async(ctx,args)=>{
 const key=args.ownerKey??await ownerKey(ctx,args.guestSecret);try{validateContent(args.content);}catch(error){throw new ConvexError(error instanceof Error?error.message:'Source could not be read.');}
 const old=await current(ctx,key);if((active(old)?._id??null)!==args.expectedId)throw new ConvexError('Your source changed in another window. Refresh and try again.');
 const {passages,...content}=args.content;const saved=old?.saved??false;
 if(old)await erase(ctx,old);
 const id=await ctx.db.insert('sources',{ownerKey:key,...content,passageCount:passages.length,saved,expiresAt:saved?null:Date.now()+3600000});
 for(const passage of passages)await ctx.db.insert('sourcePassages',{sourceId:id,...passage});const row=await ctx.db.get(id);return meta(row!);
}});
export const keep=mutation({args:{guestSecret:v.optional(v.string()),expectedId:v.id('sources'),replaceSaved:v.boolean()},returns:sourceMetaValue,handler:async(ctx,args)=>{
 const destination=await ownerKey(ctx);const key=await ownerKey(ctx,args.guestSecret);
 const row=active(await current(ctx,key));if(!row||row._id!==args.expectedId)throw new ConvexError('Your temporary source expired or changed. Add it again before saving.');
 const previous=await current(ctx,destination);
 if(previous&&previous._id!==row._id){if(!args.replaceSaved)throw new ConvexError('You already have a saved source. Choose replace to keep this one instead.');await erase(ctx,previous);}
 await ctx.db.patch(row._id,{ownerKey:destination,saved:true,expiresAt:null});return meta({...row,ownerKey:destination,saved:true,expiresAt:null});
}});
export const cleanup=internalMutation({args:{},returns:v.null(),handler:async ctx=>{
 const expired=await ctx.db.query('sources').withIndex('by_expiry',q=>q.gt('expiresAt',null).lte('expiresAt',Date.now())).take(5);
 for(const row of expired)await erase(ctx,row);return null;
}});
