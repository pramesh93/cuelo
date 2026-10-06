import {test} from 'node:test';
import assert from 'node:assert/strict';
import {checkSelectedAnswer,selectAnswerPassages,MAX_ANSWER_INPUT_BYTES} from '../convex/selectedAnswerPolicy';
const passages=[{ordinal:0,reference:'Access',text:'Single sign-on is available only if a Salesforce account is connected.'},{ordinal:1,reference:'Access',text:'Password sign-in is available on every plan.'}];
test('document answers use exact stored evidence and preserve conditions',()=>{
 const valid=checkSelectedAnswer({status:'supported',bullets:[{text:'Single sign-on is available only if Salesforce is connected.',passageIds:[0]}]},'document',passages);
 assert.equal(valid.status,'supported');assert.deepEqual(valid.citations,[passages[0]]);
 assert.equal(checkSelectedAnswer({status:'supported',bullets:[{text:'Single sign-on is available.',passageIds:[0]}]},'document',passages).status,'unverified');
 assert.equal(checkSelectedAnswer({status:'supported',bullets:[{text:'It costs $50.',passageIds:[1]}]},'document',passages).status,'unverified');
});
test('invalid citations, long answers, conflicts and generic fallbacks cannot produce a sourced answer',()=>{
 for(const raw of [{status:'supported',bullets:[{text:'Yes.',passageIds:[999]}]},{status:'supported',bullets:[{text:'word '.repeat(41),passageIds:[1]}]},{status:'generic',bullets:[{text:'Yes.',passageIds:[]}]},{status:'supported',conflicting:true,bullets:[{text:'Yes.',passageIds:[1]}]}])assert.equal(checkSelectedAnswer(raw,'document',passages).status,'unverified');
 assert.equal(checkSelectedAnswer({status:'conflict'},'document',passages).status,'conflict');
});
test('generic answers carry no citation and reject model-reported company claims',()=>{
 const result=checkSelectedAnswer({status:'generic',companySpecific:false,bullets:[{text:'SSO lets people sign in through one identity provider.',passageIds:[]}]},'generic',[]);
 assert.equal(result.status,'generic');assert.deepEqual(result.citations,[]);
 assert.equal(checkSelectedAnswer({status:'generic',companySpecific:true,bullets:[{text:'Your product supports SSO.',passageIds:[]}]},'generic',[]).status,'unverified');
 assert.equal(checkSelectedAnswer({status:'supported',bullets:[{text:'Your product supports SSO.',passageIds:[0]}]},'generic',passages).status,'unverified');
});
test('retrieval includes distant matching contradictions and refuses oversized related context without truncation',()=>{
 const rows=Array.from({length:50},(_,ordinal)=>({ordinal,reference:`Passage ${ordinal+1}`,text:ordinal===0?'SSO is supported.':ordinal===49?'SSO is not supported.':'Unrelated example content. '.repeat(100)}));
 const selected=selectAnswerPassages(rows,'Does SSO work?');assert.ok(selected.some(p=>p.ordinal===0));assert.ok(selected.some(p=>p.ordinal===49));
 assert.throws(()=>selectAnswerPassages(rows.map(p=>({...p,text:'SSO '+ 'x'.repeat(3000)})),'Does SSO work?'),/narrower/);
 assert.ok(MAX_ANSWER_INPUT_BYTES<=64000);
});
