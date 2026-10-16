import {v,ConvexError} from 'convex/values';
import {paginationOptsValidator} from 'convex/server';
import {query,mutation} from './_generated/server';
import {ownerKey} from './sources';
import {sourceKind,passageValue} from './sourceValues';
import {ownedLibrarySource,sourceVersion,assertSourceIdle,eraseLibrarySource} from './sourceLibraryStore';
import type {Doc} from './_generated/dataModel';
export const entryValue=v.object({id:v.id('sources'),title:v.string(),kind:sourceKind,url:v.union(v.string(),v.null()),createdAt:v.number(),updatedAt:v.number(),version:v.number()});
export function entry(row:Doc<'sources'>){return {id:row._id,title:row.title,kind:row.kind,url:row.url,createdAt:row.createdAt??row._creationTime,updatedAt:sourceVersion(row),version:sourceVersion(row)};}
export const list=query({args:{paginationOpts:paginationOptsValidator},returns:v.object({page:v.array(entryValue),isDone:v.boolean(),continueCursor:v.string()}),handler:async(ctx,args)=>{
 const key=await ownerKey(ctx);const result=await ctx.db.query('sources').withIndex('by_owner_saved_created',q=>q.eq('ownerKey',key).eq('saved',true)).order('desc').paginate(args.paginationOpts);
 return {page:result.page.map(entry),isDone:result.isDone,continueCursor:result.continueCursor};
}});
export const recent=query({args:{},returns:v.array(entryValue),handler:async ctx=>{
 const key=await ownerKey(ctx);return (await ctx.db.query('sources').withIndex('by_owner_saved_created',q=>q.eq('ownerKey',key).eq('saved',true)).order('desc').take(5)).map(entry);
}});
export const read=query({args:{id:v.id('sources')},returns:v.union(v.object({entry:entryValue,passages:v.array(passageValue)}),v.null()),handler:async(ctx,args)=>{
 const key=await ownerKey(ctx);if(!await ctx.db.get(args.id))return null;const row=await ownedLibrarySource(ctx,key,args.id);const passages=await ctx.db.query('sourcePassages').withIndex('by_source',q=>q.eq('sourceId',row._id)).take(501);
 return {entry:entry(row),passages:passages.map(({ordinal,reference,text})=>({ordinal,reference,text}))};
}});
export const rename=mutation({args:{id:v.id('sources'),version:v.number(),title:v.string()},returns:v.null(),handler:async(ctx,args)=>{
 const row=await ownedLibrarySource(ctx,await ownerKey(ctx),args.id);if(sourceVersion(row)!==args.version)throw new ConvexError('This content changed in another window. Reopen it before saving.');
 const title=args.title.trim();if(!title||title.length>160)throw new ConvexError('Enter a content name of up to 160 characters.');await assertSourceIdle(ctx,row._id);
 await ctx.db.patch(row._id,{title,updatedAt:Math.max(Date.now(),sourceVersion(row)+1)});return null;
}});
export const remove=mutation({args:{id:v.id('sources'),version:v.number()},returns:v.null(),handler:async(ctx,args)=>{
 const row=await ownedLibrarySource(ctx,await ownerKey(ctx),args.id);if(sourceVersion(row)!==args.version)throw new ConvexError('This content changed in another window. Refresh before deleting.');await assertSourceIdle(ctx,row._id);await eraseLibrarySource(ctx,row);return null;
}});
