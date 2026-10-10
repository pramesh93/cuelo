// Simulated Chrome APIs/DOM. Does not prove real side-panel permissions or capture.
import vm from 'node:vm';import {readFile} from 'node:fs/promises';import assert from 'node:assert/strict';
const manifest=JSON.parse(await readFile(new URL('manifest.json',import.meta.url),'utf8'));assert.equal(manifest.action.default_popup,undefined);assert.ok(manifest.permissions.includes('sidePanel'));assert.deepEqual(manifest.host_permissions,['https://meet.google.com/*']);
let clicked,receive,removed,captures=0,closed=0,joined=false,visibleTab={id:7,url:'https://meet.google.com/abc-defg-hij'};const storage={panelWindowId:1};const opened=[];
const panelSender={url:'chrome-extension://example/sidepanel.html'};
const chrome={action:{onClicked:{addListener:f=>clicked=f}},sidePanel:{open:async options=>opened.push(options.tabId)},storage:{session:{get:async key=>({[key]:storage[key]}),set:async values=>Object.assign(storage,values)}},tabs:{query:async()=>[visibleTab],sendMessage:async()=>({joined}),get:async id=>({id,url:'https://meet.google.com/abc-defg-hij'}),onRemoved:{addListener:f=>removed=f}},tabCapture:{getMediaStreamId:async options=>{captures++;assert.equal(options.targetTabId,7);return 'fake-stream';}},offscreen:{createDocument:async()=>{}},runtime:{getURL:file=>'chrome-extension://example/'+file,getContexts:async()=>[],sendMessage:async m=>{if(m.type==='stop')closed++;return {ok:true};},onMessage:{addListener:f=>receive=f}}};
vm.runInNewContext(await readFile(new URL('worker.js',import.meta.url),'utf8'),{chrome});
const send=(message,sender=panelSender)=>new Promise(resolve=>receive(message,sender,resolve));
assert.match((await send({type:'start',sourceId:'sign-in'})).error,/toolbar/);assert.equal(captures,0);
visibleTab={id:20,url:'https://www.google.com/'};clicked({...visibleTab,windowId:1});await new Promise(r=>setTimeout(r,0));assert.equal((await send({type:'status'})).meetingJoined,false);
visibleTab={id:7,url:'https://meet.google.com/abc-defg-hij'};joined=true;let detected=await send({type:'status'});assert.equal(detected.meetingJoined,true,'new joined Meet tab must be recognised without reopening');assert.equal(detected.meetingSelected,false,'detection must not invent capture permission');assert.match(detected.status,/toolbar/);joined=false;opened.length=0;
clicked({id:7,url:'https://meet.google.com/abc-defg-hij'});assert.deepEqual(opened,[7]);await new Promise(r=>setTimeout(r,0));assert.equal(storage.meetingTabId,7);
assert.match((await send({type:'start',sourceId:'unknown'})).error,/source/);assert.equal(captures,0);
assert.match((await send({type:'start',sourceId:'sign-in'})).error,/Start or join/);assert.equal(captures,0,'Meet home or pre-join must not capture');assert.equal((await send({type:'status'})).meetingJoined,false);joined=true;assert.equal((await send({type:'status'})).meetingJoined,true);
assert.equal((await send({type:'start',sourceId:'sign-in'})).active,true);assert.equal(captures,1);assert.equal(storage.probe.sourceId,'sign-in');
assert.match((await send({type:'start',sourceId:'onboarding'})).error,/already/);assert.equal(captures,1);
clicked({id:9,url:'https://meet.google.com/other-meeting'});await new Promise(r=>setTimeout(r,0));assert.equal(storage.meetingTabId,7,'opening another tab must not retarget active capture');
assert.match((await send({type:'left'},{tab:{id:9}})).error,/another tab/);assert.equal(storage.probe.active,true);
await send({type:'left'},{tab:{id:7}});assert.equal(storage.probe.active,false);assert.ok(closed>0);
await send({type:'start',sourceId:'onboarding'});removed(7);await new Promise(r=>setTimeout(r,0));assert.equal(storage.probe.active,false);
console.log('PASS simulated toolbar opens panel, binds capture tab, validates source, starts once, prevents retargeting and stops on departure/tab closure');
const entries=new Map();for(const id of ['source','start','stop','status','meter','source-preview','source-setup','meeting-audio','answers'])entries.set(id,{value:'',disabled:false,hidden:false,textContent:''});let poll,started=0,uiJoined=false,uiPermission=false;const document={getElementById:id=>entries.get(id)};
const savedUI={};const uiChrome={storage:{session:{get:async key=>({[key]:savedUI[key]}),set:async value=>Object.assign(savedUI,value)}},runtime:{sendMessage:async m=>m.type==='start'?(started++,{error:'Capture permission denied'}):{active:false,status:'Ready',meetingSelected:uiPermission,meetingJoined:uiJoined,peak:0}}};
vm.runInNewContext(await readFile(new URL('sidepanel.js',import.meta.url),'utf8'),{document,chrome:uiChrome,setInterval:f=>poll=f});await new Promise(r=>setTimeout(r,0));assert.equal(entries.get('start').disabled,true);assert.equal(entries.get('source-setup').hidden,true,'outside a call source and Start must be hidden');
entries.get('source').value='sign-in';entries.get('source').onchange();await new Promise(r=>setTimeout(r,0));assert.equal(savedUI.selectedSourceId,'sign-in','chosen source must survive panel recreation');assert.equal(entries.get('start').disabled,true,'choosing source without joined call must not enable Start');uiJoined=true;poll();await new Promise(r=>setTimeout(r,0));assert.equal(entries.get('source-setup').hidden,true,'joined meeting must hide source choices until toolbar audio permission');assert.equal(entries.get('start').disabled,true,'source selection does not grant audio permission');uiPermission=true;poll();await new Promise(r=>setTimeout(r,0));assert.equal(entries.get('start').disabled,false);assert.equal(entries.get('source-setup').hidden,false,'toolbar permission reveals source and Start');await entries.get('start').onclick();assert.equal(started,1);assert.match(entries.get('status').textContent,/denied/);poll();await new Promise(r=>setTimeout(r,0));assert.match(entries.get('status').textContent,/denied/);
console.log('PASS simulated side-panel selection enables Start and preserves capture errors during polling');

for(const id of ['source','start','stop','status','meter','source-preview','source-setup','meeting-audio','answers'])entries.set(id,{value:'',disabled:false,hidden:false,textContent:''});
vm.runInNewContext(await readFile(new URL('sidepanel.js',import.meta.url),'utf8'),{document,chrome:uiChrome,setInterval:f=>poll=f});await new Promise(r=>setTimeout(r,0));assert.equal(entries.get('source').value,'sign-in');assert.equal(entries.get('start').disabled,false);console.log('PASS source selection survives closing and reopening the side panel (simulated)');
// A new panel can open before the previous panel's async selection write finishes.
delete savedUI.selectedSourceId;
for(const id of ['source','start','stop','status','meter','source-preview','source-setup','meeting-audio','answers'])entries.set(id,{value:'',disabled:false,hidden:false,textContent:''});
vm.runInNewContext(await readFile(new URL('sidepanel.js',import.meta.url),'utf8'),{document,chrome:uiChrome,setInterval:f=>poll=f});await new Promise(r=>setTimeout(r,0));assert.equal(entries.get('source').value,'');
savedUI.selectedSourceId='onboarding';poll();await new Promise(r=>setTimeout(r,0));assert.equal(entries.get('source').value,'onboarding','late source save must be restored without another selection');assert.equal(entries.get('start').disabled,false);console.log('PASS delayed selection write is recovered by reopened panel (simulated)');
// A stale Start must never capture the previously selected meeting after a tab switch.
visibleTab={id:9,url:'https://meet.google.com/other-meeting'};
assert.match((await send({type:'start',sourceId:'sign-in'})).error,/toolbar|Meet tab/);
visibleTab={id:7,url:'https://meet.google.com/abc-defg-hij'};
// Leaving while Chrome is issuing a stream must cancel startup too.
let releaseStream;
chrome.tabCapture.getMediaStreamId=async()=>new Promise(resolve=>releaseStream=resolve);
const pendingStart=send({type:'start',sourceId:'sign-in'});
while(!releaseStream)await new Promise(r=>setTimeout(r,0));
await send({type:'left'},{tab:{id:7}});
releaseStream('fake-stream');
const cancelled=await pendingStart;
assert.match(cancelled.error,/ended|cancelled/);
assert.equal(storage.probe.active,false,'departure during startup must not resume capture');
console.log('PASS stale tab Start is rejected and departure cancels pending startup (simulated)');

uiPermission=false;poll();await new Promise(r=>setTimeout(r,0));assert.equal(entries.get('start').disabled,true);
uiPermission=true;poll();await new Promise(r=>setTimeout(r,0));assert.equal(entries.get('start').disabled,false);assert.equal(entries.get('source').value,'onboarding');assert.equal(entries.get('status').textContent,'Ready');
console.log('PASS permission recovery enables Start and retains selected source (simulated)');
