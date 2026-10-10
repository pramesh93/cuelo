// Simulated Meet DOM. Verifies lifecycle, not current Google Meet selectors.
import vm from 'node:vm';import {readFile} from 'node:fs/promises';import assert from 'node:assert/strict';
let path='/',text='',labels=[],tick;const entries=new Map();const host={isConnected:false,style:{},attachShadow:()=>({set innerHTML(_value){},getElementById:id=>{if(!entries.has(id))entries.set(id,{});return entries.get(id);}}),remove(){this.isConnected=false;}};
const messages=[];const document={createElement:()=>host,documentElement:{append:node=>node.isConnected=true},body:{get innerText(){return text;}},querySelectorAll:()=>labels.map(label=>({getAttribute:name=>name==='aria-label'?label:null,getClientRects:()=>[{width:1,height:1}]}))};
const context=vm.createContext({document,location:{get pathname(){return path;}},chrome:{runtime:{sendMessage:async m=>{messages.push(m.type);return m.type==='prepare'?{error:'Invocation required'}:{status:'Idle; no capture',peak:0};}}},setInterval:fn=>{tick=fn;},console});
try{vm.runInContext(await readFile(new URL('meeting-state.js',import.meta.url),'utf8'),context);}catch(error){if(error.code!=='ENOENT')throw error;}
vm.runInContext(await readFile(new URL('panel.js',import.meta.url),'utf8'),context);
assert.equal(host.isConnected,false,'Meet home must not display the call panel');
path='/abc-defg-hij';labels=['Join now'];tick();assert.equal(host.isConnected,false,'pre-join screen must not display call panel');
labels=['Leave call'];tick();assert.equal(host.isConnected,true,'joined call must display panel');
await entries.get('prepare').onclick();assert.match(entries.get('status').textContent,/Invocation required/);tick();await new Promise(r=>setTimeout(r,0));assert.match(entries.get('status').textContent,/Invocation required/,'capture error must survive status polling');
labels=[];text='You left the meeting';tick();await new Promise(r=>setTimeout(r,0));assert.equal(host.isConnected,false,'departure must remove panel');assert.equal(messages.filter(m=>m==='left').length,1,'departure must send stop once');
tick();assert.equal(messages.filter(m=>m==='left').length,1,'same departure must not repeat stop');
text='';labels=['Leave call'];tick();assert.equal(host.isConnected,true,'rejoining must display panel again');
console.log('PASS simulated Meet home, pre-join, joined-call, departure, duplicate departure and rejoin states');
