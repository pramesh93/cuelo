import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {ConvexReactClient} from 'convex/react';
import {WebsiteAuthProvider} from '../src/auth/SharedAuth';
import {HomeEntry} from '../src/HomeEntry';

test('public opening renders the landing page while shared sign-in is pending, with no sign-in status',()=>{
 const client=new ConvexReactClient('https://fictional-test.convex.cloud');
 const html=renderToStaticMarkup(createElement(WebsiteAuthProvider,{client,publicOpening:true,children:createElement(HomeEntry)}));
 assert.match(html,/Your quiet assistant/);
 assert.match(html,/Speak to Cuelo/);
 assert.match(html,/Sign up/);
 assert.match(html,/Sign in/);
 assert.doesNotMatch(html,/Checking your|Checking account/);
 assert.doesNotMatch(html,/My source/);
 void client.close();
});
test('protected pages do not render account content while shared sign-in is pending',()=>{
 const client=new ConvexReactClient('https://fictional-test.convex.cloud');
 const html=renderToStaticMarkup(createElement(WebsiteAuthProvider,{client,children:createElement('div',null,'Private source')}));
 assert.doesNotMatch(html,/Private source|Checking your Cuelo sign-in/);
 void client.close();
});

test('public login shows its full layout while shared sign-in is pending, without granting workspace access',async()=>{
 const {Account}=await import('../src/Account');const client=new ConvexReactClient('https://fictional-test.convex.cloud');
 const html=renderToStaticMarkup(createElement(WebsiteAuthProvider,{client,publicSignIn:true,children:createElement(Account)}));
 assert.match(html,/Welcome back/);assert.match(html,/Sign in with Google/);assert.match(html,/Try Cuelo for free/);assert.match(html,/disabled/);assert.doesNotMatch(html,/Checking your account|3 free calls|90 minutes|workspace-main/);void client.close();
});

test('Google callback shows the Cuelo signing-in loader instead of the sign-in form while auth starts',async()=>{
 const {Account}=await import('../src/Account');const previous=Object.getOwnPropertyDescriptor(globalThis,'location');Object.defineProperty(globalThis,'location',{configurable:true,value:{search:'?view=home&code=fictional-google-return-code'}});const client=new ConvexReactClient('https://fictional-test.convex.cloud');
 try{const html=renderToStaticMarkup(createElement(WebsiteAuthProvider,{client,publicSignIn:true,children:createElement(Account)}));assert.match(html,/signin-progress/);assert.doesNotMatch(html,/role="status"|favicon.png/);assert.doesNotMatch(html,/Welcome back|Sign in with Google|workspace-main/);}finally{if(previous)Object.defineProperty(globalThis,'location',previous);else delete (globalThis as any).location;void client.close();}
});
