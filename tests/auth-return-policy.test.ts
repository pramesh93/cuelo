import {test} from 'node:test';
import assert from 'node:assert/strict';
import {authReturnUrl} from '../convex/authReturnPolicy';
const dev='https://calculating-gecko-263.convex.cloud',host=dev.replace('.cloud','.site'),local='http://127.0.0.1:5173';
const prod='https://deafening-frog-846.convex.cloud';
test('hosted Google sign-in returns to its original origin despite a local default',()=>{
 assert.equal(authReturnUrl(host+'/?view=home',dev,local),host+'/?view=home');
 assert.equal(authReturnUrl(local+'/?view=sources',dev,local),local+'/?view=sources');
});
test('legacy sidebar popup keeps its exact existing callback and state',()=>{
 const path='/?view=extension-auth&state='+'a'.repeat(64);
 assert.equal(authReturnUrl(path,dev,local),local+path);
});
test('sign-in never crosses environments or accepts an outside destination',()=>{
 for(const value of [host+'/?view=home',local+'/?view=home','//evil.invalid/?view=home','https://evil.invalid/?view=home'])assert.throws(()=>authReturnUrl(value,prod,prod.replace('.cloud','.site')));
 for(const value of [prod.replace('.cloud','.site')+'/?view=home',host+'@evil.invalid/?view=home',host+'/?view=home&view=sources',host+'/foreign?view=home',host+'/?view=extension-auth&state=bad'])assert.throws(()=>authReturnUrl(value,dev,local));
});

test('authentication environment rejects custom ports, credentials, paths and lookalike hosts',()=>{
 for(const backend of ['https://calculating-gecko-263.convex.cloud:9000','https://deafening-frog-846.convex.cloud:9000','https://calculating-gecko-263.convex.cloud/foreign','https://user@calculating-gecko-263.convex.cloud','http://calculating-gecko-263.convex.cloud','https://calculating-gecko-263.convex.cloud.evil.invalid'])assert.throws(()=>authReturnUrl('/?view=home',backend,'http://127.0.0.1:5173'));
});
