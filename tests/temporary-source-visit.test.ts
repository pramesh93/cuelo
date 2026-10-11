import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createTemporarySourceVisit} from '../src/temporarySourceVisit';
function storage(){const values=new Map<string,string>();return {getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>{values.set(k,v);},removeItem:(k:string)=>{values.delete(k);}};}
const origin='https://cuelo.example';
test('temporary source survives internal navigation once but not a fresh visit or restored tab',()=>{
 const store=storage();let count=0;const random=()=>String(++count).padStart(64,'0');
 const first=createTemporarySourceVisit({storage:store,href:origin+'/?view=demo-source',referrer:'',navigation:'navigate',random});
 const secret=first.secret;
 first.transfer(origin+'/?view=answers');
 const next=createTemporarySourceVisit({storage:store,href:origin+'/?view=answers',referrer:origin+'/?view=demo-source',navigation:'navigate',random});
 assert.equal(next.secret,secret);
 const restored=createTemporarySourceVisit({storage:store,href:origin+'/?view=answers',referrer:origin+'/?view=demo-source',navigation:'back_forward',random});
 assert.notEqual(restored.secret,secret);
 const revisit=createTemporarySourceVisit({storage:store,href:origin+'/?view=answers',referrer:'',navigation:'navigate',random});
 assert.notEqual(revisit.secret,secret);
});
test('reloads, external navigation and stale handoffs cannot recover the temporary source',()=>{
 for(const navigation of ['reload','back_forward']){
 const store=storage();const first=createTemporarySourceVisit({storage:store,href:origin,referrer:'',navigation:'navigate',random:()=> 'a'.repeat(64)});
 first.transfer(origin+'/?view=answers');
 const next=createTemporarySourceVisit({storage:store,href:origin+'/?view=answers',referrer:origin,navigation,random:()=> 'b'.repeat(64)});
 assert.notEqual(next.secret,first.secret);
 }
 const store=storage();const first=createTemporarySourceVisit({storage:store,href:origin,referrer:'',navigation:'navigate',random:()=> 'a'.repeat(64)});
 first.transfer('https://outside.example/');
 const next=createTemporarySourceVisit({storage:store,href:origin,referrer:'',navigation:'navigate',random:()=> 'b'.repeat(64)});
 assert.notEqual(next.secret,first.secret);
});
test('old stored secrets and expired navigation handoffs are discarded',()=>{
 const store=storage();store.setItem('cuelo-temporary-source','a'.repeat(64));
 store.setItem('cuelo-temporary-source-handoff',JSON.stringify({secret:'a'.repeat(64),destination:origin,expires:99}));
 const visit=createTemporarySourceVisit({storage:store,href:origin,referrer:origin,navigation:'navigate',random:()=> 'b'.repeat(64),now:()=>100});
 assert.equal(visit.secret,'b'.repeat(64));assert.equal(store.getItem('cuelo-temporary-source'),null);assert.equal(store.getItem('cuelo-temporary-source-handoff'),null);
});
