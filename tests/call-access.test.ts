import {test} from 'node:test';import assert from 'node:assert/strict';
import {status} from '../convex/callAccess';
test('any signed-in account has a fresh trial without an invitation; anonymous accounts receive no trial data',async()=>{
 let subject:string|null=null;const queried:string[]=[];
 const ctx:any={auth:{getUserIdentity:async()=>subject?{subject}:null},db:{query:(name:string)=>{queried.push(name);return {withIndex:()=>({take:async()=>[]})};}}};
 let result=await status._handler(ctx,{});assert.equal(result.signedIn,false);assert.equal(result.trial,null);assert.deepEqual(queried,[]);
 subject='fictional-user|session';result=await status._handler(ctx,{});assert.equal(result.signedIn,true);assert.equal(result.trial?.callsRemaining,3);assert.equal(result.trial?.remainingMs,90*60000);assert.equal(result.trial?.exhausted,false);assert.ok(!queried.includes('testerAccess'));
});
