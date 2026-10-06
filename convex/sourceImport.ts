"use node";
import {randomBytes} from 'node:crypto';
import {action,internalAction} from './_generated/server';
import {internal} from './_generated/api';
import {v,ConvexError} from 'convex/values';
import {sourceScopeArgs,expectedSource,sourceMetaValue} from './sourceValues';
import {textSource,htmlSource,parseUpload} from './sourceContent';
import {fetchPublicPage} from './publicPage';
import type {SourceContent} from './sourceValues';
import type {ActionCtx} from './_generated/server';
import type {Infer} from 'convex/values';
import type {Id} from './_generated/dataModel';
type Scope={guestSecret?:string;expectedId:Id<'sources'>|null};
async function importSource(ctx:ActionCtx,args:Scope,read:()=>Promise<SourceContent>):Promise<Infer<typeof sourceMetaValue>> {
 await ctx.runMutation(internal.sources.admit,{guestSecret:args.guestSecret});
 try {const content=await read();return await ctx.runMutation(internal.sources.put,{guestSecret:args.guestSecret,expectedId:args.expectedId,content});}
 catch(error){if(error instanceof ConvexError)throw error;throw new ConvexError(error instanceof Error?error.message:'The source could not be read. Try another source.');}
}
export const paste=action({args:{...sourceScopeArgs,expectedId:expectedSource,title:v.string(),text:v.string()},returns:sourceMetaValue,handler:(ctx,args)=>importSource(ctx,args,async()=>textSource(args.title,args.text))});
export const webpage=action({args:{...sourceScopeArgs,expectedId:expectedSource,url:v.string()},returns:sourceMetaValue,handler:(ctx,args)=>importSource(ctx,args,async()=>{const page=await fetchPublicPage(args.url);return htmlSource(page.html,page.url);})});
export const prepareUpload=action({args:{...sourceScopeArgs,expectedId:expectedSource,name:v.string(),size:v.number()},returns:v.object({token:v.string(),url:v.string()}),handler:async(ctx,args):Promise<{token:string;url:string}>=>{
 const ownerKey=await ctx.runMutation(internal.sources.admit,{guestSecret:args.guestSecret});
 const token=randomBytes(32).toString('hex');
 await ctx.runMutation(internal.sourceUploads.create,{token,ownerKey,expectedId:args.expectedId,name:args.name,size:args.size});
 const base=process.env.CONVEX_SITE_URL;if(!base)throw new ConvexError('The upload service is not configured yet.');
 return {token,url:`${base}/sources/upload`};
}});
export const finishUpload=internalAction({args:{token:v.string()},returns:sourceMetaValue,handler:async(ctx,args):Promise<Infer<typeof sourceMetaValue>>=>{
 const grant=await ctx.runQuery(internal.sourceUploads.read,args);
 try {if(!grant.storageId)throw new ConvexError('Your upload was interrupted. Choose the file again.');const blob=await ctx.storage.get(grant.storageId);if(!blob||blob.size!==grant.size)throw new ConvexError('The file size changed during upload. Choose the file again.');
 const content=await parseUpload(grant.name,new Uint8Array(await blob.arrayBuffer()));
 return await ctx.runMutation(internal.sources.put,{ownerKey:grant.ownerKey,expectedId:grant.expectedId,content});
 }catch(error){if(error instanceof ConvexError)throw error;throw new ConvexError(error instanceof Error?error.message:'Your document could not be read. Try a text-based PDF.');}
 finally {await ctx.runMutation(internal.sourceUploads.discard,args);}
}});
