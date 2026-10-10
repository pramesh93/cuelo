import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {decodeMeetingFrame,validExtensionId} from '../src/extensionProtocol';
const extensionId='a'.repeat(32),origin='http://127.0.0.1:5173';
function event(){let listener:(...args:any[])=>void=()=>{};return {addListener:(fn:(...args:any[])=>void)=>{listener=fn;},fire:(...args:any[])=>listener(...args)};}
async function harness(){
 const action=event(),message=event(),external=event(),removed=event(),storage:Record<string,any>={},sent:any[]=[],audio:any[]=[];
 let visible={id:7,windowId:1,url:'https://meet.google.com/abc-defg-hij'},joined=true,captures=0,hold:((id:string)=>void)|null=null;
 const chrome={action:{onClicked:action},sidePanel:{open:async()=>{}},storage:{session:{get:async(keys:string|string[])=>Object.fromEntries((Array.isArray(keys)?keys:[keys]).map(k=>[k,storage[k]])),set:async(values:any)=>Object.assign(storage,values)},local:{get:async()=>({websiteOrigin:origin}),set:async()=>{}}},tabs:{get:async(id:number)=>({...visible,id,url:id===visible.id?visible.url:'https://meet.google.com/abc-defg-hij'}),sendMessage:async()=>({joined}),query:async()=>[visible],onRemoved:removed,create:async()=>({id:90}),update:async()=>{}},offscreen:{createDocument:async()=>{}},tabCapture:{getMediaStreamId:async()=>{captures++;if(hold)return new Promise<string>(resolve=>{hold=resolve;});return 'fake-stream';}},runtime:{id:extensionId,getURL:(file:string)=>`chrome-extension://${extensionId}/${file}`,getContexts:async()=>[],onMessage:message,onConnectExternal:external,sendMessage:async(m:any)=>{audio.push(m);return {ok:true};}}};
 vm.runInNewContext(await readFile('extension/meet/worker.js','utf8'),{chrome,URL,crypto});
 const send=(m:any,sender={url:chrome.runtime.getURL('sidepanel.html')})=>new Promise<any>(resolve=>message.fire(m,sender,resolve));
 const webMessage=event(),disconnect=event();let disconnected=false;
 const port={name:'cuelo-live-v1',sender:{url:`${origin}/?view=extension&extensionId=${extensionId}`,tab:{id:90}},onMessage:webMessage,onDisconnect:disconnect,disconnect:()=>{disconnected=true;},postMessage:(m:any)=>sent.push(m)};
 const flush=()=>new Promise(resolve=>setTimeout(resolve,0));
 return {chrome,action,external,removed,send,port,webMessage,disconnect,sent,audio,storage,flush,get captures(){return captures;},get disconnected(){return disconnected;},visible:(tab:typeof visible)=>{visible=tab;},joined:(value:boolean)=>{joined=value;},holdCapture:()=>{hold=()=>{};},releaseCapture:()=>hold?.('fake-stream')};
}
test('meeting PCM frames are strictly bounded and extension IDs cannot supply arbitrary destinations',()=>{
 assert.equal(decodeMeetingFrame(btoa('\0'.repeat(1600))).byteLength,1600);
 for(const value of [null,{},'a'.repeat(2136),btoa('\0'.repeat(1599)),btoa('\0'.repeat(1601))])assert.throws(()=>decodeMeetingFrame(value));
 assert.equal(validExtensionId(extensionId),true);assert.equal(validExtensionId('https://example.com'),false);assert.equal(validExtensionId('z'.repeat(32)),false);
});
test('website bridge rejects other origins, wrong routes and duplicate controllers',async()=>{
 const h=await harness();h.external.fire({...h.port,sender:{...h.port.sender,url:'https://example.com/'}});assert.equal(h.disconnected,true);assert.equal(h.sent.length,0);
 h.external.fire({...h.port,sender:{...h.port.sender,url:`${origin}/?view=account&extensionId=${extensionId}`}});assert.equal(h.sent.length,0);
 h.external.fire(h.port);assert.equal(h.sent[0].type,'connected');const before=h.sent.length;h.external.fire(h.port);assert.equal(h.sent.length,before);
});
test('new Meet detection requests toolbar permission and cannot start without backend-ready sign-in',async()=>{
 const h=await harness();h.visible({id:20,windowId:1,url:'https://www.google.com/'});h.action.fire({id:20,windowId:1,url:'https://www.google.com/'});await h.flush();
 assert.equal((await h.send({type:'status'})).meetingJoined,false);
 h.visible({id:7,windowId:1,url:'https://meet.google.com/abc-defg-hij'});let status=await h.send({type:'status'});assert.equal(status.meetingJoined,true);assert.equal(status.authorised,false);assert.match(status.message,/toolbar/);
 assert.match((await h.send({type:'start',mode:'generic'})).error,/Sign in/);assert.equal(h.captures,0);
});
async function ready(h:Awaited<ReturnType<typeof harness>>){h.external.fire(h.port);h.action.fire({id:7,windowId:1,url:'https://meet.google.com/abc-defg-hij'});await h.flush();h.webMessage.fire({type:'snapshot',view:{state:'idle',signedIn:true,invited:true,enabled:true,source:{id:'fake-source',title:'Example FAQ'},message:'Ready'}});await h.flush();}
test('only sidebar Start admits capture; source validation, original target, PCM acknowledgement and departure are enforced',async()=>{
 const h=await harness();await ready(h);
 h.webMessage.fire({type:'capture-start',deadline:Date.now()+60000,requestId:1});await h.flush();assert.equal(h.captures,0);assert.equal(h.sent.at(-1).ok,false);
 assert.match((await h.send({type:'start',mode:'document',sourceId:'other-source'})).error,/source/);assert.equal(h.captures,0);
 assert.equal((await h.send({type:'start',mode:'document',sourceId:'fake-source'})).error,undefined);
 h.webMessage.fire({type:'capture-start',deadline:Date.now()+60000,requestId:2});await h.flush();assert.equal(h.captures,1);assert.equal(h.sent.at(-1).ok,true);
 const start=h.audio.find(m=>m.type==='start');const pcm=btoa('\0'.repeat(1600));await h.send({type:'pcm',runId:start.runId,sequence:1,frame:pcm},{url:h.chrome.runtime.getURL('audio.html')});assert.equal(h.sent.at(-1).type,'frame');
 h.webMessage.fire({type:'ack',runId:start.runId,sequence:1});await h.flush();assert.ok(h.audio.some(m=>m.type==='ack'));
 h.action.fire({id:9,windowId:1,url:'https://meet.google.com/other-meeting'});await h.flush();assert.equal(h.storage.meetingTabId,7);
 assert.match((await h.send({type:'left'},{url:'',tab:{id:9}} as any)).error,/Another meeting/);
 await h.send({type:'left'},{url:'',tab:{id:7}} as any);assert.equal((await h.send({type:'status'})).capturing,false);assert.equal(h.sent.at(-1).type,'meeting-ended');
});
test('Stop during pending stream issuance prevents late capture and controller loss releases audio',async()=>{
 const h=await harness();await ready(h);await h.send({type:'start',mode:'generic'});h.holdCapture();h.webMessage.fire({type:'capture-start',deadline:Date.now()+60000,requestId:3});await h.flush();assert.equal(h.captures,1);
 await h.send({type:'stop'});h.releaseCapture();await h.flush();assert.equal(h.audio.some(m=>m.type==='start'),false);assert.equal(h.sent.at(-1).ok,false);
 h.disconnect.fire();await h.flush();assert.equal((await h.send({type:'status'})).connected,false);assert.equal(h.audio.at(-1).type,'stop');
});

test('changing tabs during authorised startup keeps capture bound to the original Meet',async()=>{
 const h=await harness();await ready(h);await h.send({type:'start',mode:'generic'});h.visible({id:20,windowId:1,url:'https://www.google.com/'});
 h.webMessage.fire({type:'capture-start',deadline:Date.now()+60000,requestId:8});await h.flush();assert.equal(h.captures,1);assert.equal(h.sent.at(-1).ok,true);assert.equal(h.storage.meetingTabId,7);
});
