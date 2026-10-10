import {test} from 'node:test';import assert from 'node:assert/strict';import {QuestionQueue} from '../extension/src/questionQueue';
const flush=()=>new Promise(r=>setTimeout(r,0));
test('conversation and later repeated questions do not cancel or reorder an earlier answer',async()=>{
 const shown:string[]=[],started:string[]=[],failures:unknown[]=[];let release!:()=>void;
 const first=new Promise<void>(r=>release=r);
 const queue=new QuestionQueue<string,string>({detect:async t=>({status:t==='conversation'?'skipped':'question',question:t}),answer:async t=>{started.push(t);if(started.length===1)await first;return t;},display:r=>shown.push(r),failure:e=>failures.push(e),changed:()=>{}});
 queue.resume();queue.add('Price?');await flush();queue.add('conversation');queue.add('Price?');queue.add('Storage?');await flush();await flush();
 assert.deepEqual(started,['Price?']);release();await flush();await flush();assert.deepEqual(shown,['Price?','Price?','Storage?']);assert.deepEqual(failures,[]);
});
test('Pause retains work, Resume restarts it, and Stop prevents late answers',async()=>{
 let release!:(r:string)=>void;const shown:string[]=[];let attempts=0;
 const queue=new QuestionQueue<number,string>({detect:async()=>({status:'question',question:'Example?'}),answer:async()=>{if(++attempts===1)return new Promise<string>(r=>release=r);return 'fresh answer';},display:r=>shown.push(r),failure:()=>{},changed:()=>{}});
 queue.resume();queue.add(1);await flush();queue.pause();release('old answer');await flush();assert.deepEqual(shown,[]);queue.resume();await flush();assert.deepEqual(shown,['fresh answer']);
 let end!:(r:string)=>void;const stopped=new QuestionQueue<number,string>({detect:async()=>({status:'question',question:'Example?'}),answer:()=>new Promise(r=>end=r),display:r=>shown.push(r),failure:()=>{},changed:()=>{}});
 stopped.resume();stopped.add(2);await flush();stopped.clear();end('late answer');await flush();assert.deepEqual(shown,['fresh answer']);
});

test('a rejected answer is reported and the queue continues to the next question',async()=>{
 const outcomes:string[]=[],failures:unknown[]=[];
 const queue=new QuestionQueue<number,{status:string}>({detect:async n=>({status:'question',question:`Question ${n}`}),answer:async n=>({status:n===1?'answer_check_failed':'supported'}),display:r=>outcomes.push(r.status),failure:e=>failures.push(e),changed:()=>{}});
 queue.resume();queue.add(1);queue.add(2);await flush();await flush();assert.deepEqual(outcomes,['answer_check_failed','supported']);assert.deepEqual(failures,[]);
});
