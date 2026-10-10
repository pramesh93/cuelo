import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ConvexError} from 'convex/values';
import {getFunctionName} from 'convex/server';
import {upload} from '../convex/sourceUploadHttp';
import {create,claim,attach,read,discard,cleanup} from '../convex/sourceUploads';

test('failed parsing releases uploaded storage once and preserves the useful error message',async()=>{
 let exists=false,deletions=0,attached=false;
 const ctx={storage:{store:async()=>{exists=true;return 'made-up-storage';},delete:async()=>{if(!exists)throw new Error('already deleted');exists=false;deletions++;}},
 runMutation:async(fn:any)=>{const name=getFunctionName(fn);if(name.endsWith(':claim'))return {size:3};if(name.endsWith(':attach')){attached=true;return null;}if(name.endsWith(':discard'))return null;throw new Error(name);},
 runAction:async()=>{assert.equal(attached,true);exists=false;deletions++;throw new ConvexError('Documents must contain at most 50 pages.');}} as any;
 const response=await upload._handler(ctx,new Request('https://example.com/sources/upload',{method:'POST',headers:{Authorization:`Bearer ${'a'.repeat(64)}`},body:new Uint8Array([1,2,3])}));
 assert.equal(response.status,400);assert.match((await response.json()).error,/50 pages/);assert.equal(deletions,1);
});
test('upload rejects unapproved origins and mismatched bytes before storing anything',async()=>{
 let stored=0,discarded=0;
 const ctx={storage:{store:async()=>{stored++;}},runMutation:async(fn:any)=>{if(getFunctionName(fn).endsWith(':claim'))return {size:2};discarded++;}} as any;
 const foreign=await upload._handler(ctx,new Request('https://example.com/sources/upload',{method:'POST',headers:{Origin:'https://evil.example'}}));assert.equal(foreign.status,403);
 const malformed=await upload._handler(ctx,new Request('https://example.com/sources/upload',{method:'POST',headers:{Authorization:`Bearer ${'a'.repeat(64)}`},body:new Uint8Array([1,2,3])}));assert.equal(malformed.status,400);assert.equal(stored,0);assert.equal(discarded,1);
});
test('upload grants are single-use, expire and delete abandoned original files',async()=>{
 const rows=new Map<string,any>();let deleted=0;const ctx={db:{insert:async(_table:string,row:any)=>{rows.set('grant',{_id:'grant',_creationTime:0,...row});},query:()=>({withIndex:(_index:string,select:any)=>{const constraints:any[]=[];const q:any={eq:(k:string,v:any)=>{constraints.push((r:any)=>r[k]===v);return q;},lte:(k:string,v:any)=>{constraints.push((r:any)=>r[k]<=v);return q;}};select(q);return {take:async()=>[...rows.values()].filter(r=>constraints.every(f=>f(r)))};}}),patch:async(id:string,value:any)=>Object.assign(rows.get(id),value),delete:async(id:string)=>{rows.delete(id);}},storage:{delete:async()=>{deleted++;}}} as any;
 const args={token:'a'.repeat(64),ownerKey:'guest:made-up',expectedId:null,name:'example.pdf',size:3};
 await assert.rejects(()=>create._handler(ctx,{...args,size:10*1024*1024+1}),/10 MB/);assert.equal(rows.size,0);
 await create._handler(ctx,args);assert.deepEqual(await claim._handler(ctx,{token:args.token}),{size:3});await assert.rejects(()=>claim._handler(ctx,{token:args.token}),/used/);
 await attach._handler(ctx,{token:args.token,storageId:'made-up-storage' as any});await assert.rejects(()=>attach._handler(ctx,{token:args.token,storageId:'different-storage' as any}),/expired/);
 rows.get('grant').expiresAt=Date.now()-1;await assert.rejects(()=>read._handler(ctx,{token:args.token}),/expired/);await cleanup._handler(ctx,{});assert.equal(deleted,1);assert.equal(rows.size,0);
 await discard._handler(ctx,{token:args.token});assert.equal(deleted,1);
});

test('native sidebar upload still requires a backend-issued one-use grant',async()=>{
 const origin=`chrome-extension://${'a'.repeat(32)}`;let claims=0,stores=0;const ctx={storage:{store:async()=>{stores++;return 'made-up-file';}},runMutation:async(fn:any)=>{if(getFunctionName(fn).endsWith(':claim')){claims++;return {size:3};}return null;},runAction:async()=>({id:'made-up-source'})} as any;
 const missing=await upload._handler(ctx,new Request('https://example.com/sources/upload',{method:'POST',headers:{Origin:origin},body:new Uint8Array([1,2,3])}));assert.equal(missing.status,401);assert.equal(claims,0);assert.equal(stores,0);
 const valid=await upload._handler(ctx,new Request('https://example.com/sources/upload',{method:'POST',headers:{Origin:origin,Authorization:`Bearer ${'a'.repeat(64)}`},body:new Uint8Array([1,2,3])}));assert.equal(valid.status,200);assert.equal(valid.headers.get('Access-Control-Allow-Origin'),origin);assert.equal(claims,1);assert.equal(stores,1);
 const invalid=await upload._handler(ctx,new Request('https://example.com/sources/upload',{method:'POST',headers:{Origin:'chrome-extension://not-a-chrome-id'}}));assert.equal(invalid.status,403);
});
