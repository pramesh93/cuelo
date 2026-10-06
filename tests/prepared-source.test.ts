import {test} from "node:test";
import assert from "node:assert/strict";
import {consume,discard,expire,start,store} from "../convex/preparedSources";
import {ask} from "../convex/evaluation";
import {Agent} from "@convex-dev/agent";
import type {Id} from "../convex/_generated/dataModel";
import {SOURCE_URL} from "../convex/evidence";

const ticket={id:"made-up-source-id" as Id<"preparedSources">,secret:"made-up-secret"};
const source={title:"Public sample",url:SOURCE_URL,passages:[{id:0,section:"Sample",text:"Public sample text."}]};

test("prepared source is owned, single-use, expires and is removed on cancellation",async()=>{
  let row:any=null;
  const scheduled:any[]=[];
  const ctx={db:{
    get:async()=>row,
    delete:async()=>{row=null;},
    insert:async(_table:unknown,value:unknown)=>{row={_id:ticket.id,...value as object};return ticket.id;},
    patch:async(_id:unknown,value:unknown)=>Object.assign(row,value),
    query:()=>({withIndex:()=>({take:async()=>row && row.expiresAt>Date.now() ? [row] : []})}),
  },scheduler:{runAfter:async(delay:unknown,_fn:unknown,args:unknown)=>{scheduled.push({delay,args});}}} as unknown as Parameters<typeof start._handler>[0];
  assert.equal(await start._handler(ctx,{secret:ticket.secret}),ticket.id);
  assert.equal(await start._handler(ctx,{secret:"other"}),null,"one in-flight source preparation");
  assert.equal(scheduled[0].delay,120000,"abandoned preparation has scheduled expiry");
  assert.equal(await store._handler(ctx,{ticket,source}),true);
  assert.equal(await consume._handler(ctx,{ticket:{...ticket,secret:"wrong"}}),null);
  await discard._handler(ctx,{ticket:{...ticket,secret:"wrong"}});assert.ok(row,"wrong owner cannot discard");
  assert.deepEqual(await consume._handler(ctx,{ticket}),source);
  assert.equal(await consume._handler(ctx,{ticket}),null,"second use fails");
  await start._handler(ctx,{secret:ticket.secret});await store._handler(ctx,{ticket,source});
  row.expiresAt=Date.now()-1;assert.equal(await consume._handler(ctx,{ticket}),null);assert.equal(row,null);
  await start._handler(ctx,{secret:ticket.secret});await discard._handler(ctx,{ticket});assert.equal(row,null);
  await start._handler(ctx,{secret:ticket.secret});row.expiresAt=Date.now()-1;await expire._handler(ctx,{id:ticket.id});assert.equal(row,null);
});

test("preloaded answers skip downloading but retain the model and evidence refusal",async t=>{
  const oldKey=process.env.OPENAI_API_KEY,oldSwitch=process.env.EVALUATION_TESTING_ENABLED;
  process.env.OPENAI_API_KEY="fake-test-key";process.env.EVALUATION_TESTING_ENABLED="true";
  let fetches=0;let modelCalls=0;let sourceAvailable=true;
  t.mock.method(globalThis,"fetch",async()=>{fetches++;throw new Error("Should use the prepared source");});
  const ctx={runMutation:async(_fn:unknown,args:Record<string,unknown>)=>{
    if("ticket" in args) {assert.deepEqual(args.ticket,ticket);return sourceAvailable ? source : null;}
    if("threadId" in args) return null;
    if("userId" in args) return {_id:"temporary-thread"};
    return true;
  }} as unknown as Parameters<typeof ask._handler>[0];
  t.mock.method(Agent.prototype,"generateText",async(_ctx:unknown,_options:unknown,request:{prompt:string})=>{
    modelCalls++;assert.deepEqual(JSON.parse(request.prompt).source,source);
    return {text:JSON.stringify({status:"unverified",answer:"Not verified in this source",passageIds:[]})};
  });
  try {
    const result=await ask._handler(ctx,{question:"Can you guarantee a custom integration by Friday?",sourceTicket:ticket});
    assert.equal(result.answer,"Not verified in this source");assert.equal(result.excerpt,null);assert.equal(fetches,0);assert.equal(modelCalls,1);
    sourceAvailable=false;
    const expired=await ask._handler(ctx,{question:"Public question",sourceTicket:ticket});
    assert.equal(expired.status,"error");assert.match(expired.answer,/expired/);assert.equal(fetches,0);assert.equal(modelCalls,1);
  } finally {
    if(oldKey===undefined) delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=oldKey;
    if(oldSwitch===undefined) delete process.env.EVALUATION_TESTING_ENABLED;else process.env.EVALUATION_TESTING_ENABLED=oldSwitch;
  }
});
