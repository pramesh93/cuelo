import {test} from 'node:test';import assert from 'node:assert/strict';import {createElement} from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {TrialAllowance} from '../src/Onboarding';
test('trial wording shows only remaining free calls and meeting minutes after usage',()=>{
 const html=renderToStaticMarkup(createElement(TrialAllowance,{trial:{callsUsed:1,callsRemaining:2,listeningMs:30000,trialMs:75000,remainingMs:5325000,exhausted:false}}));
 assert.doesNotMatch(html,/Paused time|Whichever|3 calls/);assert.match(html,/2 free calls · 89 free meeting minutes remaining/);
});
