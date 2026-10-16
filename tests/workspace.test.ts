import {test} from 'node:test';import assert from 'node:assert/strict';
import {workspaceFixture} from './workspace-fixture';
import {put,get,answerSource,selected,cleanup as sourceCleanup} from '../convex/sources';
import {list,read,rename,remove,recent} from '../convex/sourceLibrary';
import {overview} from '../convex/dashboard';
import {textSource} from '../convex/sourceContent';
import {contentList} from '../src/contentList';

const make=(ctx:any,title='Example content',text='Fictional product includes example support.')=>put._handler(ctx,{expectedId:null,library:true,content:textSource(title,text)});
test('library keeps multiple named sources and legacy saved content, with owned selected evidence',async()=>{
 const f=workspaceFixture();const legacy=await put._handler(f.ctx,{expectedId:null,content:textSource('Existing document','Fictional existing content.')});await f.ctx.db.patch(legacy.id,{saved:true,expiresAt:null});
 const first=await make(f.ctx,'First document');const second=await make(f.ctx,'Second document');
 assert.equal(f.table('sources').size,3);assert.equal((await get._handler(f.ctx,{}))?.id,legacy.id);
 const page=await list._handler(f.ctx,{paginationOpts:{numItems:2,cursor:null}});assert.equal(page.page.length,2);assert.equal(page.isDone,false);const next=await list._handler(f.ctx,{paginationOpts:{numItems:2,cursor:page.continueCursor}});assert.equal(next.page.length,1);assert.equal(next.page[0].id,legacy.id);
 assert.equal((await selected._handler(f.ctx,{id:first.id}))?.title,'First document');assert.equal((await answerSource._handler(f.ctx,{id:first.id})).meta.title,'First document');assert.equal((await answerSource._handler(f.ctx,{id:second.id})).meta.title,'Second document');
 f.setUser('other-user|session');assert.deepEqual((await list._handler(f.ctx,{paginationOpts:{numItems:50,cursor:null}})).page,[]);assert.equal(await selected._handler(f.ctx,{id:first.id}),null);await assert.rejects(()=>read._handler(f.ctx,{id:first.id}),/unavailable/);await assert.rejects(()=>answerSource._handler(f.ctx,{id:first.id}),/deleted|expired/);await assert.rejects(()=>rename._handler(f.ctx,{id:first.id,version:1,title:'Wrong account'}),/unavailable/);await assert.rejects(()=>remove._handler(f.ctx,{id:first.id,version:1}),/unavailable/);
});
test('editing preserves creation date, replaces old passages, and rejects stale saves/deletes',async()=>{
 const f=workspaceFixture();const first=await make(f.ctx);const original=(await read._handler(f.ctx,{id:first.id})).entry;
 const edited=await put._handler(f.ctx,{library:true,expectedId:first.id,expectedVersion:original.version,content:textSource('Updated example','Fictional updated source text.')});
 const updated=(await read._handler(f.ctx,{id:edited.id})).entry;assert.equal(updated.createdAt,original.createdAt);assert.ok(updated.updatedAt>original.updatedAt);assert.equal(f.table('sources').size,1);assert.equal(f.table('sourcePassages').size,1);assert.equal([...f.table('sourcePassages').values()][0].text,'Fictional updated source text.');
 await assert.rejects(()=>put._handler(f.ctx,{library:true,expectedId:first.id,expectedVersion:original.version,content:textSource('Stale update','Other fictional text.')}),/unavailable/);
 await rename._handler(f.ctx,{id:edited.id,version:updated.version,title:'New label'});await assert.rejects(()=>remove._handler(f.ctx,{id:edited.id,version:updated.version}),/changed/);const current=(await read._handler(f.ctx,{id:edited.id})).entry;await remove._handler(f.ctx,{id:edited.id,version:current.version});assert.equal(f.table('sources').size,0);assert.equal(f.table('sourcePassages').size,0);
});
test('active and paused calls protect their selected library content from edit or deletion',async()=>{
 const f=workspaceFixture();const first=await make(f.ctx);const data=(await read._handler(f.ctx,{id:first.id})).entry;const call=await f.ctx.db.insert('liveCalls',{sourceId:first.id,state:'paused'});
 await assert.rejects(()=>rename._handler(f.ctx,{id:first.id,version:data.version,title:'Renamed'}),/Stop Cuelo/);await assert.rejects(()=>remove._handler(f.ctx,{id:first.id,version:data.version}),/Stop Cuelo/);await assert.rejects(()=>put._handler(f.ctx,{library:true,expectedId:first.id,expectedVersion:data.version,content:textSource('Replacement','Fictional replacement.')}),/Stop Cuelo/);assert.equal(f.table('sources').size,1);await f.ctx.db.delete(call);
});
test('signed-out library and dashboard calls are denied, never treated as guest content',async()=>{
 const f=workspaceFixture();f.setUser(null);await assert.rejects(()=>list._handler(f.ctx,{paginationOpts:{numItems:10,cursor:null}}),/Sign in/);await assert.rejects(()=>overview._handler(f.ctx,{}),/Sign in/);await assert.rejects(()=>put._handler(f.ctx,{ownerKey:'guest:fictional',library:true,expectedId:null,content:textSource('Example','Fictional content.')}),/Sign in/);
});
test('dashboard uses account-owned totals and date-only call records, never historical content',async()=>{
 const f=workspaceFixture();f.table('users').set('fictional-user',{_id:'fictional-user',name:'Example User',email:'example@example.invalid'});await f.ctx.db.insert('accountMetrics',{userId:'fictional-user',calls:2,listeningMs:120000,answers:7});await f.ctx.db.insert('callRecords',{userId:'fictional-user',startedAt:100,endedAt:200,listeningMs:60000,answers:3});await f.ctx.db.insert('callRecords',{userId:'other-user',startedAt:100,endedAt:200,listeningMs:999999,answers:99});
 const data=await overview._handler(f.ctx,{});assert.equal(data.profile.email,'example@example.invalid');assert.equal(data.totals.answers,7);assert.equal(data.recentCalls.length,1);assert.deepEqual(Object.keys(data.recentCalls[0]).sort(),['answers','endedAt','id','listeningMs','startedAt']);assert.equal(data.trial.callsRemaining,3);
 f.setUser('other-user|session');const other=await overview._handler(f.ctx,{});assert.equal(other.totals.answers,0);assert.equal(other.recentCalls[0].answers,99);
});
test('content search, source filter and every sort preserve stored data and default newest first',()=>{
 const items=[{id:'a',title:'Alpha guide',kind:'pdf',createdAt:1,updatedAt:9,version:9,url:null},{id:'b',title:'Beta guide',kind:'text',createdAt:3,updatedAt:4,version:4,url:null},{id:'c',title:'Gamma link',kind:'webpage',createdAt:2,updatedAt:5,version:5,url:'https://example.invalid'}];
 assert.deepEqual(contentList(items,'','all','newest').map(x=>x.id),['b','c','a']);assert.deepEqual(contentList(items,' GUIDE ','pdf','newest').map(x=>x.id),['a']);assert.deepEqual(contentList(items,'','all','modified').map(x=>x.id),['a','c','b']);assert.deepEqual(contentList(items,'','all','oldest').map(x=>x.id),['a','c','b']);assert.deepEqual(contentList(items,'','all','name').map(x=>x.id),['a','b','c']);assert.equal(items[0].id,'a');
});
test('recent content stays ordered by original creation time after an older document is edited',async()=>{
 const f=workspaceFixture();const first=await make(f.ctx,'Older content');await f.ctx.db.patch(first.id,{createdAt:1});const second=await make(f.ctx,'Newer content');await f.ctx.db.patch(second.id,{createdAt:2});const old=(await read._handler(f.ctx,{id:first.id}))!.entry;
 await put._handler(f.ctx,{library:true,expectedId:first.id,expectedVersion:old.version,content:textSource('Edited older content','Fictional updated content.')});const rows=await recent._handler(f.ctx,{});assert.deepEqual(rows.map(r=>r.title),['Newer content','Edited older content']);
});

test('temporary-source expiry cleanup still deletes expired text when an obsolete call link awaits cleanup',async()=>{const f=workspaceFixture();const temporary=await put._handler(f.ctx,{expectedId:null,content:textSource('Fictional temporary source','Fictional expiring text.')});await f.ctx.db.patch(temporary.id,{expiresAt:Date.now()-1000});const call=await f.ctx.db.insert('liveCalls',{sourceId:temporary.id,state:'active',deadline:Date.now()-1000});await f.ctx.db.insert('liveCallSources',{sessionId:call,sourceId:temporary.id});await sourceCleanup._handler(f.ctx,{});assert.equal(f.table('sources').size,0);assert.equal(f.table('sourcePassages').size,0);});
