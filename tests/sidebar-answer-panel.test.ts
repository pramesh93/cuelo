import {test} from 'node:test';
import assert from 'node:assert/strict';
import {showAnswer} from '../extension/src/answerPanel';
test('each repeated question produces a new latest answer and retains earlier answers in order',()=>{
 const first={question:'What is the price?',answer:'$29'};
 const second={question:'What is the price?',answer:'$29'};
 const third={question:'Where is data stored?',answer:'EU'};
 const initial={result:null,previousAnswers:[]} as {result:typeof first|null;previousAnswers:typeof first[]};
 const one=showAnswer(initial,first),two=showAnswer(one,second),three=showAnswer(two,third);
 assert.equal(two.result,second);assert.deepEqual(two.previousAnswers,[first]);
 assert.equal(three.result,third);assert.deepEqual(three.previousAnswers,[second,first]);
 assert.equal(one.result,first);assert.deepEqual(one.previousAnswers,[]);
});
