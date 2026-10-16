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
type Scope={guestSecret?:string;expectedId:Id<'sources'>|null;library?:boolean;expectedVersion?:number};
const libraryArgs={library:v.optional(v.boolean()),expectedVersion:v.optional(v.number())};
async function importSource(ctx:ActionCtx,args:Scope,read:()=>Promise<SourceContent>):Promise<Infer<typeof sourceMetaValue>> {
 const key=await ctx.runMutation(internal.sources.admit,{guestSecret:args.guestSecret});if(args.library&&!key.startsWith('user:'))throw new ConvexError('Sign in to save content to your library.');
 try {const content=await read();return await ctx.runMutation(internal.sources.put,{guestSecret:args.guestSecret,expectedId:args.expectedId,...(args.library?{library:true,...(args.expectedVersion!==undefined?{expectedVersion:args.expectedVersion}:{})}:{}),content});}
 catch(error){if(error instanceof ConvexError)throw error;throw new ConvexError(error instanceof Error?error.message:'The source could not be read. Try another source.');}
}
export const paste=action({args:{...sourceScopeArgs,...libraryArgs,expectedId:expectedSource,title:v.string(),text:v.string()},returns:sourceMetaValue,handler:(ctx,args)=>importSource(ctx,args,async()=>textSource(args.title,args.text))});
export const webpage=action({args:{...sourceScopeArgs,...libraryArgs,expectedId:expectedSource,url:v.string(),title:v.optional(v.string())},returns:sourceMetaValue,handler:(ctx,args)=>importSource(ctx,args,async()=>{const page=await fetchPublicPage(args.url);const content=htmlSource(page.html,page.url);return args.title?{...content,title:args.title.trim()}:content;})});
export const prepareUpload=action({args:{...sourceScopeArgs,...libraryArgs,expectedId:expectedSource,name:v.string(),size:v.number(),title:v.optional(v.string())},returns:v.object({token:v.string(),url:v.string()}),handler:async(ctx,args):Promise<{token:string;url:string}>=>{
 const ownerKey=await ctx.runMutation(internal.sources.admit,{guestSecret:args.guestSecret});
 if(args.library&&!ownerKey.startsWith('user:'))throw new ConvexError('Sign in to save content to your library.');
 const token=randomBytes(32).toString('hex');
 await ctx.runMutation(internal.sourceUploads.create,{token,ownerKey,expectedId:args.expectedId,name:args.name,size:args.size,...(args.library?{library:true,...(args.title?{title:args.title}:{}),...(args.expectedVersion!==undefined?{expectedVersion:args.expectedVersion}:{})}:{})});
 const base=process.env.CONVEX_SITE_URL;if(!base)throw new ConvexError('The upload service is not configured yet.');
 return {token,url:`${base}/sources/upload`};
}});
export const finishUpload=internalAction({args:{token:v.string()},returns:sourceMetaValue,handler:async(ctx,args):Promise<Infer<typeof sourceMetaValue>>=>{
 const grant=await ctx.runQuery(internal.sourceUploads.read,args);
 try {if(!grant.storageId)throw new ConvexError('Your upload was interrupted. Choose the file again.');const blob=await ctx.storage.get(grant.storageId);if(!blob||blob.size!==grant.size)throw new ConvexError('The file size changed during upload. Choose the file again.');
 const content=await parseUpload(grant.name,new Uint8Array(await blob.arrayBuffer()));
 return await ctx.runMutation(internal.sources.put,{ownerKey:grant.ownerKey,expectedId:grant.expectedId,...(grant.library?{library:true,...(grant.expectedVersion!==undefined?{expectedVersion:grant.expectedVersion}:{})}:{}),content:grant.title?{...content,title:grant.title.trim()}:content});
 }catch(error){if(error instanceof ConvexError)throw error;throw new ConvexError(error instanceof Error?error.message:'Your document could not be read. Try a text-based PDF.');}
 finally {await ctx.runMutation(internal.sourceUploads.discard,args);}
}});
