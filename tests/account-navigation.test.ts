import {test} from 'node:test';import assert from 'node:assert/strict';
import {createElement} from 'react';import {renderToStaticMarkup} from 'react-dom/server';
import {AccountNavigation} from '../src/Topbar';
import {websiteReturnPath,accountLink} from '../src/auth/navigation';
test('new visitors can find signup and login; signed-in visitors find their account and saved source',()=>{
 const guest=renderToStaticMarkup(createElement(AccountNavigation,{signedIn:false}));
 assert.match(guest,/>Sign up</);assert.match(guest,/>Sign in</);
 assert.match(guest,/intent=signup/);assert.match(guest,/intent=login/);
 const signedIn=renderToStaticMarkup(createElement(AccountNavigation,{signedIn:true}));
 assert.match(signedIn,/>Sign out</);
 const busy=renderToStaticMarkup(createElement(AccountNavigation,{signedIn:true,busy:true}));
 assert.match(busy,/disabled/);assert.match(busy,/>Signing out…</);
 assert.doesNotMatch(guest,/>Sign out</);
 assert.match(signedIn,/>My source</);assert.match(signedIn,/>My account</);
 assert.doesNotMatch(signedIn,/>Sign in</);
});
test('login returns to saved sources only for the allowed destination, never an outside website',()=>{
 assert.equal(websiteReturnPath('/?view=sources'),'/?view=sources');
 for(const unsafe of ['https://example.invalid','//example.invalid','/?view=live',undefined])assert.equal(websiteReturnPath(unsafe),'/?view=home');
 assert.equal(accountLink('signup','sources'),'/?view=account&intent=signup&next=sources');
});
