import {test} from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {get,put,remove,keep,passages,cleanup} from '../convex/sources';
import {textSource} from '../convex/sourceContent';
if(!globalThis.crypto)Object.defineProperty(globalThis,'crypto',{value:webcrypto});
function fixture(){let subject:string|null=null;let serial=0;const tables=new Map<string,Map<string,any>>();
 const table=(name:string)=>{if(!tables.has(name))tables.set(name,new Map());return tables.get(name)!;};
 const ctx={auth:{getUserIdentity:async()=>subject?{subject}:null},db:{
 query:(name:string)=>({withIndex:(_index:string,select:(q:any)=>any)=>{const rules:Array<(r:any)=>boolean>=[];const q:any={eq:(k:string,v:any)=>{rules.push(r=>r[k]===v);return q;},gt:(k:string,v:any)=>{rules.push(r=>r[k]>v);return q;},lte:(k:string,v:any)=>{rules.push(r=>r[k]<=v);return q;}};select(q);return {take:async(n:number)=>[...table(name).values()].filter(r=>rules.every(f=>f(r))).slice(0,n)};}}),
 insert:async(name:string,row:any)=>{const id=`${name}-${++serial}`;table(name).set(id,{_id:id,_creationTime:Date.now(),...row});return id;},
 get:async(id:string)=>{for(const t of tables.values())if(t.has(id))return t.get(id);return null;},
 patch:async(id:string,values:any)=>{for(const t of tables.values())if(t.has(id))Object.assign(t.get(id),values);},
 delete:async(id:string)=>{for(const t of tables.values())t.delete(id);},
 }};return {ctx:ctx as any,table,setUser:(id:string|null)=>{subject=id;}};
}
const a='a'.repeat(64),b='b'.repeat(64);
test('temporary sources are isolated, replace atomically and delete all search passages',async()=>{
 const f=fixture();const first=await put._handler(f.ctx,{guestSecret:a,expectedId:null,content:textSource('Example FAQ','Made-up first source.')});
 assert.equal(first.saved,false);assert.equal(await get._handler(f.ctx,{guestSecret:b}),null);
 await assert.rejects(()=>passages._handler(f.ctx,{guestSecret:b,id:first.id}),/unavailable/);
 await assert.rejects(()=>put._handler(f.ctx,{guestSecret:a,expectedId:null,content:textSource('Another FAQ','New content.')}),/changed/);
 const replacement=await put._handler(f.ctx,{guestSecret:a,expectedId:first.id,content:textSource('Another FAQ','New content.')});
 assert.equal(f.table('sources').size,1);assert.equal(f.table('sourcePassages').size,1);assert.equal([...f.table('sourcePassages').values()][0].sourceId,replacement.id);
 await remove._handler(f.ctx,{guestSecret:a,expectedId:replacement.id});assert.equal(f.table('sources').size,0);assert.equal(f.table('sourcePassages').size,0);
});
test('saving requires sign-in and explicit replacement, never transfers another account source',async()=>{
 const f=fixture();const guest=await put._handler(f.ctx,{guestSecret:a,expectedId:null,content:textSource('Guest FAQ','Made-up guest content.')});
 await assert.rejects(()=>keep._handler(f.ctx,{guestSecret:a,expectedId:guest.id,replaceSaved:false}),/Sign in/);
 f.setUser('made-up-a|session');const saved=await keep._handler(f.ctx,{guestSecret:a,expectedId:guest.id,replaceSaved:false});assert.equal(saved.saved,true);assert.equal(saved.expiresAt,null);
 assert.equal(await get._handler(f.ctx,{guestSecret:a}),null);
 f.setUser('made-up-b|session');assert.equal(await get._handler(f.ctx,{}),null);assert.equal(await remove._handler(f.ctx,{expectedId:saved.id}),null);assert.equal(f.table('sources').size,1);
 f.setUser('made-up-a|session');const other=await put._handler(f.ctx,{guestSecret:b,expectedId:null,content:textSource('Other FAQ','Other made-up text.')});
 await assert.rejects(()=>keep._handler(f.ctx,{guestSecret:b,expectedId:other.id,replaceSaved:false}),/already/);
 await keep._handler(f.ctx,{guestSecret:b,expectedId:other.id,replaceSaved:true});assert.equal(f.table('sources').size,1);assert.equal(f.table('sourcePassages').size,1);
});
test('expired guest sources disappear and cleanup removes their passages while keeping saved sources',async()=>{
 const f=fixture();const source=await put._handler(f.ctx,{guestSecret:a,expectedId:null,content:textSource('Example','Made-up text.')});f.table('sources').get(source.id).expiresAt=Date.now()-1;
 assert.equal(await get._handler(f.ctx,{guestSecret:a}),null);await cleanup._handler(f.ctx,{});assert.equal(f.table('sourcePassages').size,0);assert.equal(f.table('sources').size,0);
});
