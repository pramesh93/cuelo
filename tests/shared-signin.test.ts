import {test} from 'node:test';import assert from 'node:assert/strict';
import {createSharedSession,authSenderAllowed,allowedWebsite,type Stored} from '../src/auth/sharedSession';
const backend='https://calculating-gecko-263.convex.cloud';
const jwt=(subject:string,version=1)=>'example.'+btoa(JSON.stringify({sub:subject,version}))+'.example';
function fixture(){
 let saved:Stored|null=null,stops=0,refreshes=0,valid=true,failLogout=false;
 const callbacks:Array<string>=[],rawTokens={token:jwt('fictional-user|session'),refreshToken:'fictional-refresh'};
 const service=createSharedSession({backend,load:async()=>saved,save:async state=>{saved=state;},legacy:async()=>null,validate:async()=>valid,stopCall:async()=>{stops++;},call:async(name,args)=>{
  if(name==='signOut'){if(failLogout)throw Error('SIMULATED offline');return null;}
  if(args.refreshToken){refreshes++;return {tokens:{token:jwt('fictional-user|session',refreshes+1),refreshToken:'fictional-refreshed-'+refreshes}};}
  if(args.provider==='google'){const verifier='verifier-'+callbacks.length;callbacks.push(verifier);return {redirect:'https://example.invalid/google',verifier};}
  return {tokens:rawTokens};
 }});
 return {service,rawTokens,get saved(){return saved;},get stops(){return stops;},get refreshes(){return refreshes;},invalid:()=>valid=false,offlineLogout:()=>failLogout=true};
}
async function login(f:ReturnType<typeof fixture>){
 const started=await f.service.run({operation:'signIn',args:{provider:'google',params:{redirectTo:'/?view=account'}}});
 return f.service.run({operation:'signIn',args:{params:{code:'fictional-one-use-code'},verifier:started.verifier}});
}
test('website login is visible to sidebar and later website state without sharing refresh credentials',async()=>{
 const f=fixture();const website=await login(f),sidebar=await f.service.run({operation:'state'});
 assert.equal(website.state.token,sidebar.state.token);assert.equal(f.saved?.refreshToken,'fictional-refresh');
 assert.equal('refreshToken' in sidebar.state,false);assert.equal(JSON.stringify(sidebar).includes('fictional-refresh'),false);
});
test('sidebar login is visible to website; either-side logout clears both and cannot revive stale legacy credentials',async()=>{
 const f=fixture();await login(f);f.offlineLogout();
 const loggedOut=await f.service.run({operation:'signOut'});assert.equal(loggedOut.state.token,null);
 const website=await f.service.run({operation:'import',tokens:f.rawTokens});
 assert.equal(website.state.token,null);assert.equal(f.saved?.refreshToken,null);assert.equal(f.stops,2);
});
test('simultaneous refreshes use one central credential and stale callers adopt the new login',async()=>{
 const f=fixture();await login(f);
 const [one,two]=await Promise.all([f.service.run({operation:'refresh',token:f.rawTokens.token}),f.service.run({operation:'refresh',token:f.rawTokens.token})]);
 assert.equal(f.refreshes,1);assert.equal(one.state.token,two.state.token);assert.equal(f.stops,1);
});
test('Google callbacks from before logout are rejected and cannot silently sign both surfaces back in',async()=>{
 const f=fixture(),started=await f.service.run({operation:'signIn',args:{provider:'google',params:{redirectTo:'/?view=account'}}});
 await f.service.run({operation:'signOut'});
 await assert.rejects(()=>f.service.run({operation:'signIn',args:{params:{code:'old-code'},verifier:started.verifier}}),/cancelled/);
 assert.equal((await f.service.run({operation:'state'})).state.token,null);
});
test('existing website credentials require backend verification and only initialise an empty shared login',async()=>{
 const f=fixture();f.invalid();
 await assert.rejects(()=>f.service.run({operation:'import',tokens:f.rawTokens}),/expired/);
 assert.equal(f.saved?.token,null);
 const fresh=fixture();const imported=await fresh.service.run({operation:'import',tokens:fresh.rawTokens});
 assert.equal(imported.state.token,jwt('fictional-user|session',2));
});
test('only configured Cuelo website top frames and the sidebar/session owner can access shared login',()=>{
 const id='a'.repeat(32),sender={id,frameId:0,url:'http://127.0.0.1:5173/?view=account'};
 assert.equal(authSenderAllowed(sender,id,backend),true);
 for(const other of [{...sender,id:'foreign'},{...sender,frameId:1},{...sender,url:'https://meet.google.com/abc-defg-hij'},{...sender,url:'http://127.0.0.1:9999/'},{...sender,url:'https://deafening-frog-846.convex.site/'}])assert.equal(authSenderAllowed(other,id,backend),false);
 assert.equal(authSenderAllowed({id,url:`chrome-extension://${id}/auth-check.html`},id,backend),true);
 assert.equal(allowedWebsite('http://127.0.0.1:5173','https://deafening-frog-846.convex.cloud'),false);
});
test('unsupported sign-in providers, raw refresh injection and off-site returns are rejected',async()=>{
 const f=fixture();
 for(const args of [{provider:'password'},{refreshToken:'injected'},{provider:'google',params:{redirectTo:'https://example.invalid'}},{params:{code:'arbitrary'},verifier:'arbitrary'}])await assert.rejects(()=>f.service.run({operation:'signIn',args}));
 assert.equal(f.saved?.token,null);
});
test('an ongoing Google login survives renewal of the existing session',async()=>{
 const f=fixture();await login(f);
 const started=await f.service.run({operation:'signIn',args:{provider:'google',params:{redirectTo:'/?view=account'}}});
 await f.service.run({operation:'refresh',token:f.rawTokens.token});
 assert.ok((await f.service.run({operation:'signIn',args:{params:{code:'new-code'},verifier:started.verifier}})).state.token);
});
