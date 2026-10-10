import {test} from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFile} from 'node:fs/promises';
async function panel(){
 const entries=new Map<string,any>();for(const id of ['mode','source','connection','setup','controls','pause','resume','stop','document','generic','start','status','state','mode-summary','warning','answer','question','provenance','answer-text','refusal','citation','excerpt','evidence','timing','source-help','connect','configure','origin'])entries.set(id,{value:'',textContent:'',hidden:false,disabled:false,dataset:{},children:[],replaceChildren(...items:any[]){this.children=items;},appendChild(item:any){this.children.push(item);}});
 let current:any={connected:false,view:null,meetingJoined:false,authorised:false,message:'Start or join a Google Meet call.'},poll:()=>void=()=>{};const storage:any={};const sent:any[]=[];
 const chrome={storage:{session:{get:async()=>({selection:storage.selection}),set:async(value:any)=>Object.assign(storage,value)},local:{get:async()=>({})}},runtime:{sendMessage:async(m:any)=>{sent.push(m);return m.type==='status'?current:{};}}};
 const document={getElementById:(id:string)=>entries.get(id),createElement:()=>({textContent:''})};
 vm.runInNewContext(await readFile('extension/meet/sidepanel.js','utf8'),{chrome,document,Option:class {constructor(public text:string,public value:string){}},setInterval:(f:()=>void)=>poll=f});
 const flush=()=>new Promise(resolve=>setTimeout(resolve,0));await flush();
 return {el:(id:string)=>entries.get(id),storage,sent,update:async(value:any)=>{current=value;poll();await flush();}};
}
const ready={state:'idle',signedIn:true,invited:true,enabled:true,source:{id:'fake-source',title:'Example FAQ'},message:'Ready'};
test('sidebar source and Start stay hidden until toolbar invocation; chosen source survives permission changes',async()=>{
 const p=await panel();assert.equal(p.el('setup').hidden,true);
 await p.update({view:ready,meetingJoined:true,authorised:false,message:'Click toolbar.'});assert.equal(p.el('setup').hidden,true);assert.equal(p.el('status').textContent,'Click toolbar.');
 await p.update({view:ready,meetingJoined:true,authorised:true,message:'Ready'});assert.equal(p.el('setup').hidden,false);assert.equal(p.el('start').disabled,true);
 p.el('mode').value='document';p.el('mode').onchange();p.el('source').value='fake-source';p.el('source').onchange();assert.equal(p.el('start').disabled,false);
 await p.update({view:ready,meetingJoined:true,authorised:false,message:'Click toolbar.'});assert.equal(p.el('setup').hidden,true);
 await p.update({view:ready,meetingJoined:true,authorised:true,message:'Ready'});assert.equal(p.el('source').value,'fake-source');assert.equal(p.el('start').disabled,false);
});
test('real answer result fields render bullets, citations and evidence; generic provenance and refusal remain clear',async()=>{
 const p=await panel();await p.update({view:{...ready,state:'listening',result:{mode:'document',status:'supported',question:'Does the example offer setup help?',bullets:['A setup checklist is provided.'],citations:[{reference:'Getting started',text:'The example includes a setup checklist.'}],source:{title:'Example FAQ'},elapsedMs:1200}},meetingJoined:true,authorised:true});
 assert.equal(p.el('answer').hidden,false);assert.equal(p.el('answer-text').children[0].textContent,'A setup checklist is provided.');assert.equal(p.el('citation').textContent,'Getting started · Example FAQ');assert.equal(p.el('excerpt').textContent,'The example includes a setup checklist.');assert.equal(p.el('evidence').hidden,false);assert.equal(p.el('provenance').hidden,true);
 await p.update({view:{...ready,state:'listening',result:{mode:'generic',status:'generic',bullets:['Ask a clear follow-up question.'],citations:[],source:null}},meetingJoined:true,authorised:true});assert.equal(p.el('provenance').hidden,false);assert.equal(p.el('citation').textContent,'');assert.equal(p.el('evidence').hidden,true);
 await p.update({view:{...ready,state:'listening',result:{mode:'document',status:'unverified',message:"I couldn't find this in your source.",bullets:[],citations:[]}},meetingJoined:true,authorised:true});assert.equal(p.el('refusal').textContent,"I couldn't find this in your source.");assert.equal(p.el('answer-text').children.length,0);
 await p.update({view:{...ready,state:'idle',result:null},meetingJoined:true,authorised:true});assert.equal(p.el('answer').hidden,true);assert.equal(p.el('excerpt').textContent,'');
});

test('Resume waits for server pause cleanup, while Stop remains available',async()=>{
 const p=await panel();await p.update({view:{...ready,state:'paused',controlsBusy:true},meetingJoined:true,authorised:true});assert.equal(p.el('resume').disabled,true);assert.equal(p.el('stop').disabled,false);
 await p.update({view:{...ready,state:'paused',controlsBusy:false},meetingJoined:true,authorised:true});assert.equal(p.el('resume').disabled,false);
});
