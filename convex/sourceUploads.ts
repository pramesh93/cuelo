import {v,ConvexError} from 'convex/values';
import {internalMutation,internalQuery} from './_generated/server';
import {expectedSource} from './sourceValues';
import {MAX_SOURCE_BYTES} from './sourceLimits';
const grant=v.object({token:v.string(),ownerKey:v.string(),expectedId:expectedSource,name:v.string(),size:v.number(),expiresAt:v.number(),state:v.union(v.literal('ready'),v.literal('receiving')),storageId:v.union(v.id('_storage'),v.null())});
export const create=internalMutation({args:{token:v.string(),ownerKey:v.string(),expectedId:expectedSource,name:v.string(),size:v.number()},returns:v.null(),handler:async(ctx,args)=>{
 if(!Number.isInteger(args.size)||args.size<1||args.size>MAX_SOURCE_BYTES)throw new ConvexError('Choose a file no larger than 10 MB.');
 if(args.name.length>160||! /\.(pdf|docx)$/i.test(args.name))throw new ConvexError('Choose a PDF or Word .docx file with a name of at most 160 characters.');
 await ctx.db.insert('sourceUploads',{...args,expiresAt:Date.now()+120000,state:'ready',storageId:null});return null;
}});
export const claim=internalMutation({args:{token:v.string()},returns:v.object({size:v.number()}),handler:async(ctx,args)=>{
 const row=(await ctx.db.query('sourceUploads').withIndex('by_token',q=>q.eq('token',args.token)).take(1))[0];
 if(!row||row.state!=='ready'||row.expiresAt<=Date.now())throw new ConvexError('This upload permission expired or was used. Choose the file again.');
 await ctx.db.patch(row._id,{state:'receiving'});return {size:row.size};
}});
export const attach=internalMutation({args:{token:v.string(),storageId:v.id('_storage')},returns:v.null(),handler:async(ctx,args)=>{
 const row=(await ctx.db.query('sourceUploads').withIndex('by_token',q=>q.eq('token',args.token)).take(1))[0];if(!row||row.state!=='receiving'||row.storageId||row.expiresAt<=Date.now())throw new ConvexError('Your upload expired. Choose the file again.');
 await ctx.db.patch(row._id,{storageId:args.storageId});return null;
}});
export const read=internalQuery({args:{token:v.string()},returns:grant,handler:async(ctx,args)=>{
 const row=(await ctx.db.query('sourceUploads').withIndex('by_token',q=>q.eq('token',args.token)).take(1))[0];if(!row||row.expiresAt<=Date.now()||row.state!=='receiving')throw new ConvexError('Your upload expired. Choose the file again.');
 const {_id,_creationTime,...value}=row;return value;
}});
export const discard=internalMutation({args:{token:v.string()},returns:v.null(),handler:async(ctx,args)=>{
 const row=(await ctx.db.query('sourceUploads').withIndex('by_token',q=>q.eq('token',args.token)).take(1))[0];if(row){if(row.storageId)await ctx.storage.delete(row.storageId);await ctx.db.delete(row._id);}return null;
}});
export const cleanup=internalMutation({args:{},returns:v.null(),handler:async ctx=>{
 const rows=await ctx.db.query('sourceUploads').withIndex('by_expiry',q=>q.lte('expiresAt',Date.now())).take(100);
 for(const row of rows){if(row.storageId)await ctx.storage.delete(row.storageId);await ctx.db.delete(row._id);}return null;
}});
