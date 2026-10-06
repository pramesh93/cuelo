import {test} from "node:test";
import assert from "node:assert/strict";
import {reserve,release,status} from "../convex/speechBudget";

test("speech spending is capped across visitors, blocks concurrency, and an old request cannot release a newer lease",async () => {
  const original={key:process.env.DEEPGRAM_API_KEY,speech:process.env.SPEECH_TESTING_ENABLED,openai:process.env.OPENAI_API_KEY,answers:process.env.EVALUATION_TESTING_ENABLED};
  let row:Record<string,unknown> | undefined;
  let answerCount=0;
  const ctx={db:{
    query:(table:string)=>({withIndex:()=>({take:async()=> table==="speechUsage" ? row ? [row] : [] : [{count:answerCount}]})}),
    insert:async (_table:string,value:Record<string,unknown>)=>{row={_id:"fake-id",...value};return "fake-id";},
    patch:async (_id:unknown,value:Record<string,unknown>)=>{Object.assign(row!,value);},
  }} as unknown as Parameters<typeof reserve._handler>[0];
  process.env.DEEPGRAM_API_KEY="fake-test-key";process.env.SPEECH_TESTING_ENABLED="true";
  process.env.OPENAI_API_KEY="fake-test-key";process.env.EVALUATION_TESTING_ENABLED="true";
  try {
    assert.equal(await reserve._handler(ctx,{lease:"first"}),"ready");
    assert.equal(await reserve._handler(ctx,{lease:"second"}),"busy");
    assert.equal(row?.count,1);
    await release._handler(ctx,{lease:"old"});assert.equal(row?.activeLease,"first");
    await release._handler(ctx,{lease:"first"});assert.equal(row?.activeLease,null);
    for(let i=1;i<10;i++) {
      const lease=`attempt-${i}`;
      assert.equal(await reserve._handler(ctx,{lease}),"ready");
      await release._handler(ctx,{lease});
    }
    assert.equal(await reserve._handler(ctx,{lease:"eleventh"}),"exhausted");
    assert.equal(row?.count,10);assert.ok(Number(row?.reservedUsd)<=0.100001);
    assert.equal((await status._handler(ctx,{})).enabled,false);
    row!.count=0;row!.activeUntil=Date.now()-1;
    answerCount=10;
    assert.equal(await reserve._handler(ctx,{lease:"no-answers"}),"answers_exhausted");
    assert.equal(row?.count,0);
    answerCount=0;process.env.SPEECH_TESTING_ENABLED="false";
    assert.equal(await reserve._handler(ctx,{lease:"off"}),"disabled");
  } finally {
    for(const [name,value] of Object.entries({DEEPGRAM_API_KEY:original.key,SPEECH_TESTING_ENABLED:original.speech,OPENAI_API_KEY:original.openai,EVALUATION_TESTING_ENABLED:original.answers})) {
      if(value===undefined) delete process.env[name];else process.env[name]=value;
    }
  }
});
