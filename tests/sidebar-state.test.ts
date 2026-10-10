import {test} from 'node:test';import assert from 'node:assert/strict';import {sidebarScreen,startBlock} from '../extension/src/sidebarState';
test('both opening orders wait for remembered account and then show sign-in or sources (simulated)',()=>{
 const ready={checking:false,meeting:true,authLoading:false,authenticated:true,accessLoading:false};
 assert.equal(sidebarScreen({...ready,meeting:false}),'no-meeting');assert.equal(sidebarScreen({...ready,authLoading:true,authenticated:false}),'checking-account');assert.equal(sidebarScreen(ready),'setup');assert.equal(sidebarScreen({...ready,authenticated:false}),'sign-in');assert.equal(sidebarScreen({...ready,accessLoading:true}),'checking-access');
});
test('Start explains each blocker and automatically clears when requirements become ready',()=>{
 const ready={eligible:true,invited:true,enabled:true,busy:false,mode:'document' as const,sourceSelected:true,sourceLoading:false};
 assert.equal(startBlock(ready),null);assert.match(startBlock({...ready,eligible:false})!,/Join a Meet/);assert.match(startBlock({...ready,invited:false})!,/tester/);assert.match(startBlock({...ready,enabled:false})!,/not enabled/);assert.match(startBlock({...ready,sourceLoading:true})!,/loading/);assert.match(startBlock({...ready,sourceSelected:false})!,/ready source/);assert.equal(startBlock({...ready,mode:'generic',sourceSelected:false,sourceLoading:true}),null);
});
