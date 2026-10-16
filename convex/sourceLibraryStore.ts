import {ConvexError} from 'convex/values';
import type {MutationCtx,QueryCtx} from './_generated/server';
import type {Doc,Id} from './_generated/dataModel';
import type {SourceContent} from './sourceValues';
import {validateContent} from './sourceLimits';

export function sourceVersion(row:Doc<'sources'>){return row.updatedAt??row._creationTime;}
export async function ownedLibrarySource(ctx:QueryCtx,key:string,id:Id<'sources'>){
 const row=await ctx.db.get(id);
 if(!row||row.ownerKey!==key||!row.saved||row.expiresAt!==null)throw new ConvexError('This content is unavailable. Refresh your content list.');
 return row;
}
export async function assertSourceIdle(ctx:QueryCtx,id:Id<'sources'>){
 const calls=await ctx.db.query('liveCalls').withIndex('by_source',q=>q.eq('sourceId',id)).take(1);
 const linked=await ctx.db.query('liveCallSources').withIndex('by_source',q=>q.eq('sourceId',id)).take(1);
 if(calls.length||linked.length)throw new ConvexError('This content is being used in a call. Stop Cuelo before editing or deleting it.');
}
export async function eraseLibrarySource(ctx:MutationCtx,row:Doc<'sources'>){
 for(const passage of await ctx.db.query('sourcePassages').withIndex('by_source',q=>q.eq('sourceId',row._id)).take(501))await ctx.db.delete(passage._id);
 await ctx.db.delete(row._id);
}
export async function saveLibraryContent(ctx:MutationCtx,key:string,expectedId:Id<'sources'>|null,expectedVersion:number|undefined,content:SourceContent){
 if(!key.startsWith('user:'))throw new ConvexError('Sign in to save content to your library.');
 validateContent(content);
 const old=expectedId?await ownedLibrarySource(ctx,key,expectedId):null;
 if(old){if(expectedVersion!==sourceVersion(old))throw new ConvexError('This content changed in another window. Close this form and reopen it before saving.');await assertSourceIdle(ctx,old._id);}
 const now=Date.now();const {passages,...fields}=content;
 // New ID invalidates any earlier selected evidence. Replacement and deletion are atomic.
 const id=await ctx.db.insert('sources',{...fields,ownerKey:key,passageCount:passages.length,saved:true,expiresAt:null,library:true,createdAt:old?.createdAt??old?._creationTime??now,updatedAt:Math.max(now,(old?sourceVersion(old):0)+1)});
 for(const passage of passages)await ctx.db.insert('sourcePassages',{sourceId:id,...passage});
 if(old)await eraseLibrarySource(ctx,old);
 return (await ctx.db.get(id))!;
}
