import {httpAction} from './_generated/server';
import {internal} from './_generated/api';
import {ConvexError} from 'convex/values';
import {MAX_SOURCE_BYTES} from './sourceLimits';
function cors(request:Request) {
 const origin=request.headers.get('Origin')??'';
 const allowed=[process.env.CONVEX_SITE_URL,process.env.SITE_URL,'http://127.0.0.1:5173','http://localhost:5173'];
 // A Chrome-assigned origin grants no access: uploads still need a one-use
 // permission issued by the backend after checking source ownership.
 if(origin&&!allowed.includes(origin)&&!/^chrome-extension:\/\/[a-p]{32}$/.test(origin))return null;
 return {'Access-Control-Allow-Origin':origin||'*','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Authorization, Content-Type','Vary':'Origin'};
}
export const options=httpAction(async(_ctx,request)=>{const headers=cors(request);return new Response(null,{status:headers?204:403,headers:headers??{}});});
export const upload=httpAction(async(ctx,request)=>{
 const headers=cors(request);if(!headers)return new Response('Origin not allowed',{status:403});
 const token=request.headers.get('Authorization')?.replace(/^Bearer /,'')??'';
 if(!/^[a-f0-9]{64}$/.test(token))return new Response(JSON.stringify({error:'Your upload permission is missing. Choose the file again.'}),{status:401,headers:{...headers,'Content-Type':'application/json'}});
 let claimed=false;let stored:import('./_generated/dataModel').Id<'_storage'>|null=null;const reader=request.body?.getReader();
 try {
 const grant=await ctx.runMutation(internal.sourceUploads.claim,{token});claimed=true;
 if(!reader)throw new ConvexError('Your upload was empty. Choose the file again.');
 const chunks:Uint8Array[]=[];let size=0;const deadline=Date.now()+30000;
 while(true){let timer:ReturnType<typeof setTimeout>|undefined;const result=await Promise.race([reader.read(),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new ConvexError('Your upload took too long. Choose the file again.')),Math.max(1,deadline-Date.now()));})]).finally(()=>{if(timer)clearTimeout(timer);});if(result.done)break;size+=result.value.byteLength;if(size>MAX_SOURCE_BYTES||size>grant.size)throw new ConvexError('Choose a file no larger than 10 MB. The upload size did not match.');chunks.push(result.value);}
 if(size!==grant.size)throw new ConvexError('Your file upload was incomplete. Choose it again.');
 stored=await ctx.storage.store(new Blob(chunks as BlobPart[],{type:'application/octet-stream'}));await ctx.runMutation(internal.sourceUploads.attach,{token,storageId:stored});stored=null;
 const source=await ctx.runAction(internal.sourceImport.finishUpload,{token});stored=null;
 return new Response(JSON.stringify(source),{headers:{...headers,'Content-Type':'application/json'}});
 }catch(error){await reader?.cancel().catch(()=>{});if(stored)await ctx.storage.delete(stored);if(claimed)await ctx.runMutation(internal.sourceUploads.discard,{token});
 const message=error instanceof ConvexError&&typeof error.data==='string'?error.data:'The file could not be read. Try a readable PDF or Word .docx file.';
 return new Response(JSON.stringify({error:message}),{status:400,headers:{...headers,'Content-Type':'application/json'}});
 }
});
