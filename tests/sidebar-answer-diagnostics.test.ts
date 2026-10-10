import {test} from 'node:test';import assert from 'node:assert/strict';
import {emptyDiagnostics,recordDiagnostic} from '../extension/src/answerDiagnostics';
test('temporary diagnostics distinguish requested, returned and displayed counts without retaining content',()=>{
 let state=emptyDiagnostics();state=recordDiagnostic(state,'Request 1 sent','requests');state=recordDiagnostic(state,'Request 1 returned: supported; ignored after more speech','responses');
 assert.equal(state.requests,1);assert.equal(state.responses,1);assert.equal(state.displayed,0);
 state=recordDiagnostic(state,'Request 2 sent','requests');state=recordDiagnostic(state,'Request 2 returned: supported','responses');state=recordDiagnostic(state,'Request 2 displayed','displayed');
 assert.equal(state.displayed,1);assert.equal(state.responses,2);
 for(let i=0;i<20;i++)state=recordDiagnostic(state,'Speech detected');assert.equal(state.events.length,12);
 assert.deepEqual(emptyDiagnostics(),{speechStarts:0,requests:0,responses:0,displayed:0,events:[]});
});
