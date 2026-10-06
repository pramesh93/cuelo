import {test} from "node:test";
import assert from "node:assert/strict";
import {reserve as reserveAnswer} from "../convex/evaluationBudget";
import {status, reserve as reserveSpeech} from "../convex/speechBudget";
import {answerAttemptLimit} from "../convex/testingLimits";

test("authorised retest adds exactly four answers without resetting usage or increasing speech",async()=>{
  const names=["EVALUATION_ATTEMPT_LIMIT","EVALUATION_TESTING_ENABLED","SPEECH_TESTING_ENABLED","OPENAI_API_KEY","DEEPGRAM_API_KEY"];
  const previous=names.map(name=>process.env[name]);
  const answers={_id:"fake-answer-counter",count:10,reservedUsd:1};
  const speech={_id:"fake-speech-counter",count:6,reservedUsd:0.06,activeUntil:0};
  const ctx={db:{query:(table:string)=>({withIndex:()=>({take:async()=>[table==="evaluationUsage" ? answers : speech]})}),patch:async(_id:unknown,values:Record<string,unknown>)=>Object.assign(answers,values)}} as unknown as Parameters<typeof reserveAnswer._handler>[0];
  try {
    process.env.EVALUATION_TESTING_ENABLED="true";process.env.SPEECH_TESTING_ENABLED="true";
    process.env.OPENAI_API_KEY="fake-test-key";process.env.DEEPGRAM_API_KEY="fake-test-key";
    delete process.env.EVALUATION_ATTEMPT_LIMIT;
    assert.equal(answerAttemptLimit(),10);
    assert.equal(await reserveAnswer._handler(ctx,{}),false);
    process.env.EVALUATION_ATTEMPT_LIMIT="14";
    assert.equal((await status._handler(ctx,{})).enabled,true);
    for(let i=0;i<4;i++) assert.equal(await reserveAnswer._handler(ctx,{}),true);
    assert.equal(answers.count,14);assert.ok(Math.abs(answers.reservedUsd-1.4)<1e-9);
    assert.equal(await reserveAnswer._handler(ctx,{}),false);
    assert.equal((await status._handler(ctx,{})).enabled,false);
    assert.equal(await reserveSpeech._handler(ctx,{lease:"blocked"}),"answers_exhausted");
    answers.count=10;speech.count=10;
    assert.equal(await reserveSpeech._handler(ctx,{lease:"speech-limit"}),"exhausted");
    process.env.EVALUATION_ATTEMPT_LIMIT="999";
    assert.equal(answerAttemptLimit(),0);
    assert.equal(await reserveAnswer._handler(ctx,{}),false);
  } finally {
    names.forEach((name,i)=>{if(previous[i]===undefined) delete process.env[name];else process.env[name]=previous[i];});
  }
});
