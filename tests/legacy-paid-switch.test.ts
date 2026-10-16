import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ask} from '../convex/evaluation';
import {reserve as reserveAnswer} from '../convex/evaluationBudget';
import {reserve as reserveSpeech,status} from '../convex/speechBudget';
test('main paid switch blocks legacy answers and speech before source reads, reservations or provider calls',async t=>{
 const settings={V1_PAID_TESTING_ENABLED:'true',EVALUATION_TESTING_ENABLED:'true',SPEECH_TESTING_ENABLED:'true',OPENAI_API_KEY:'fake',DEEPGRAM_API_KEY:'fake'};
 const previous=Object.fromEntries(Object.keys(settings).map(key=>[key,process.env[key]]));
 t.mock.method(globalThis,'fetch',async()=>{assert.fail('Disabled testing must not fetch sources or call providers');});
 const ctx={db:{query:()=>{assert.fail('Disabled testing must not read or change allowances');}},runMutation:async()=>{assert.fail('Disabled answer must not consume a source or reserve spending');}} as any;
 try{
 Object.assign(process.env,settings);
 for(const flag of [undefined,'false','TRUE']){
 if(flag===undefined)delete process.env.V1_PAID_TESTING_ENABLED;else process.env.V1_PAID_TESTING_ENABLED=flag;
 const answer=await ask._handler(ctx,{question:'Does the example plan include SSO?'});
 assert.equal(answer.status,'error');assert.match(answer.answer,/switched off/);
 assert.equal(await reserveAnswer._handler(ctx,{}),false);
 assert.equal(await reserveSpeech._handler(ctx,{lease:'fictional'}),'disabled');
 const speech=await status._handler(ctx,{});assert.equal(speech.enabled,false);assert.match(speech.message,/switched off/);
 }
 }finally{for(const [key,value] of Object.entries(previous)){if(value===undefined)delete process.env[key];else process.env[key]=value;}}
});
test('enabling only the landing demo keeps legacy answer and microphone budgets disabled',async()=>{
 const keys=['V1_PAID_TESTING_ENABLED','OPENING_DEMO_TESTING_ENABLED','EVALUATION_TESTING_ENABLED','SPEECH_TESTING_ENABLED','OPENAI_API_KEY','DEEPGRAM_API_KEY'];const previous=keys.map(key=>process.env[key]);
 try{Object.assign(process.env,{V1_PAID_TESTING_ENABLED:'true',OPENING_DEMO_TESTING_ENABLED:'true',EVALUATION_TESTING_ENABLED:'false',SPEECH_TESTING_ENABLED:'false',OPENAI_API_KEY:'fake',DEEPGRAM_API_KEY:'fake'});const ctx={db:{query:()=>{assert.fail('Legacy budgets must stay disabled');}}} as any;
 assert.equal(await reserveAnswer._handler(ctx,{}),false);assert.equal(await reserveSpeech._handler(ctx,{lease:'fictional'}),'disabled');assert.equal((await status._handler(ctx,{})).enabled,false);
 }finally{keys.forEach((key,index)=>{if(previous[index]===undefined)delete process.env[key];else process.env[key]=previous[index];});}
});
