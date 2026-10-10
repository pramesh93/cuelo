// OAuth replies and Chrome events below are simulated; no live Google sign-in.
import {test} from 'node:test';import assert from 'node:assert/strict';import {signInThroughPopup} from '../extension/src/authFlow';
// @ts-expect-error browser worker policy is a plain JavaScript module.
import {authReturn,checkAuthStart} from '../extension/meet/auth-policy.js';
const nonce='a'.repeat(64),site='https://calculating-gecko-263.convex.site',local='http://127.0.0.1:5173';
test('Google redirect becomes a popup and the returned code is exchanged with the original verifier',async()=>{
 const calls:any[]=[],popupCalls:any[]=[];const tokens={token:'fake-session-token',refreshToken:'fake-refresh-token'};
 const result=await signInThroughPopup({args:{provider:'google'},nonce:()=>nonce,call:async args=>{calls.push(args);return calls.length===1?{redirect:`${site}/api/auth/signin/google?code=fake-start`,verifier:'fake-verifier'}:{tokens};},popup:async(...args)=>{popupCalls.push(args);return 'fake-final-code';}});
 assert.equal(calls[0].params.redirectTo,`/?view=extension-auth&state=${nonce}`);assert.deepEqual(calls[1],{params:{code:'fake-final-code'},verifier:'fake-verifier'});assert.equal(popupCalls.length,1);assert.deepEqual(result,{tokens});assert.equal(result.redirect,undefined,'the SDK must never navigate the sidebar away');
});
test('refresh and code exchanges do not open Google again; cancellation never exchanges a code',async()=>{
 let opened=0,called=0;const call=async()=>{called++;return {tokens:{token:'fake',refreshToken:'fake'}};};const popup=async()=>{opened++;return 'fake';};
 await signInThroughPopup({args:{refreshToken:'fake'},call,popup,nonce:()=>nonce});await signInThroughPopup({args:{params:{code:'fake'}},call,popup,nonce:()=>nonce});assert.equal(opened,0);assert.equal(called,2);
 const exchanges:any[]=[];await assert.rejects(()=>signInThroughPopup({args:{provider:'google'},nonce:()=>nonce,call:async args=>{exchanges.push(args);return {redirect:`${site}/api/auth/signin/google?code=fake`,verifier:'fake-verifier'};},popup:async()=>{throw Error('Cancelled');}}),/Cancelled/);assert.equal(exchanges.length,1);
});
test('only the configured Cuelo Google endpoint and exact callback with matching state are accepted',()=>{
 assert.ok(checkAuthStart(`${site}/api/auth/signin/google?code=fake`,site));
 for(const url of ['https://example.com/api/auth/signin/google?code=fake',`${site}/api/auth/signin/other?code=fake`,`${site}/api/auth/signin/google`,`${site.replace('https://','https://user@')}/api/auth/signin/google?code=fake`])assert.throws(()=>checkAuthStart(url,site));
 assert.equal(authReturn(`${local}/?view=extension-auth&state=${nonce}&code=fake`,local,nonce),'fake');
 for(const url of [`https://example.com/?view=extension-auth&state=${nonce}&code=fake`,`${local}/?view=extension-auth&state=wrong&code=fake`,`${local}/?view=account&state=${nonce}&code=fake`])assert.equal(authReturn(url,local,nonce),null);
 assert.throws(()=>authReturn(`${local}/?view=extension-auth&state=${nonce}&code=one&code=two`,local,nonce));
});
