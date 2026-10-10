import {test} from 'node:test';
import assert from 'node:assert/strict';
import {answerLimitReached,limitReachedView} from '../extension/src/answerLimit';
test('fourth answer ends listening while retaining all cards and blocking resume',()=>{
 const view={result:{question:'Fourth'},previousAnswers:[{question:'Third'},{question:'Second'},{question:'First'}]};
 assert.equal(answerLimitReached(3,4),false);
 assert.equal(answerLimitReached(4,4),true);
 const stopped={...view,...limitReachedView(4)};
 assert.equal(stopped.state,'limited');assert.equal(stopped.result,view.result);assert.equal(stopped.previousAnswers,view.previousAnswers);
 assert.match(stopped.message,/Four-answer test limit reached/);
});
import {QuestionQueue} from '../extension/src/questionQueue';
test('queued fifth question is not answered after fourth response stops the queue',async()=>{
 let panel={result:null as number|null,previousAnswers:[] as number[]},requests=0;
 const {showAnswer}=await import('../extension/src/answerPanel');
 let done!:()=>void;const finished=new Promise<void>(resolve=>{done=resolve;});
 const queue=new QuestionQueue<number,number>({
  detect:async turn=>({status:'question',question:String(turn)}),
  answer:async turn=>{requests++;return turn;},
  display:answer=>{panel=showAnswer(panel,answer);if(answerLimitReached(requests,4)){queue.clear();done();}},
  failure:error=>{throw error;},changed:()=>{},
 });
 for(let turn=1;turn<=6;turn++)queue.add(turn);
 queue.resume();await finished;await new Promise(resolve=>setImmediate(resolve));
 assert.equal(requests,4);assert.equal(panel.result,4);assert.deepEqual(panel.previousAnswers,[3,2,1]);
});
