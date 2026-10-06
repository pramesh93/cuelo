import {test} from "node:test";
import assert from "node:assert/strict";
import {status,setTesterAccess} from "../convex/callAccess";
import type {Id} from "../convex/_generated/dataModel";

test("call access checks the signed-in account and invitation; live capture stays disabled",async()=>{
  let identity:{subject:string}|null=null;
  let invitation:{enabled:boolean}|undefined;
  let lookupCount=0;
  const ctx={auth:{getUserIdentity:async()=>identity},db:{query:()=>{lookupCount++;return {withIndex:()=>({take:async()=>invitation ? [invitation] : []})};}}} as unknown as Parameters<typeof status._handler>[0];
  let result=await status._handler(ctx,{});
  assert.equal(result.signedIn,false);assert.equal(result.invited,false);assert.equal(lookupCount,0);
  identity={subject:"fictional-user|fictional-session"};
  result=await status._handler(ctx,{});assert.equal(result.signedIn,true);assert.equal(result.invited,false);
  invitation={enabled:true};result=await status._handler(ctx,{});
  assert.equal(result.invited,true);assert.equal(result.liveEnabled,false);
  invitation.enabled=false;assert.equal((await status._handler(ctx,{})).invited,false);
});

test("tester access can be granted or revoked by internal mutation only and requires an existing account",async()=>{
  let exists=false;let row:Record<string,unknown>|undefined;
  const ctx={db:{get:async()=>exists ? {} : null,query:()=>({withIndex:()=>({take:async()=>row ? [row] : []})}),insert:async(_table:string,value:Record<string,unknown>)=>{row={_id:"fictional-access",...value};},patch:async(_id:unknown,value:Record<string,unknown>)=>{Object.assign(row!,value);}}} as unknown as Parameters<typeof setTesterAccess._handler>[0];
  const userId="fictional-user" as Id<"users">;
  assert.equal(setTesterAccess.isInternal,true);
  await assert.rejects(()=>setTesterAccess._handler(ctx,{userId,enabled:true}),/Account not found/);
  exists=true;await setTesterAccess._handler(ctx,{userId,enabled:true});assert.equal(row?.enabled,true);
  await setTesterAccess._handler(ctx,{userId,enabled:false});assert.equal(row?.enabled,false);
});
