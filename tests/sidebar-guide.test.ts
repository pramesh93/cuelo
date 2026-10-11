import {test} from 'node:test';import assert from 'node:assert/strict';
import {createElement} from 'react';import {renderToStaticMarkup} from 'react-dom/server';
import {ConvexAuthProvider} from '@convex-dev/auth/react';
import {SidebarGuide} from '../src/SidebarGuide';import {ConvexProviderWithAuth,ConvexReactClient} from 'convex/react';import {readFile} from 'node:fs/promises';
test('old live URL shows sidebar guidance with no capture, reservation or floating-card action',async()=>{
 const html=renderToStaticMarkup(createElement(ConvexAuthProvider,{client:new ConvexReactClient('https://example.convex.cloud')},createElement(SidebarGuide)));
 assert.match(html,/Use Cuelo in the Chrome sidebar/);assert.match(html,/Audio is off/);
 assert.doesNotMatch(html,/Prepare call|Connect call audio|Open floating card|<button/);
 const entry=await readFile('src/main.tsx','utf8');
 assert.match(entry,/view === "live" \? <SidebarGuide\/>/);
 assert.doesNotMatch(entry,/import.*LiveCall/);
 const account=await readFile('src/Account.tsx','utf8');
 assert.match(account,/<SidebarInstructions\/>/);assert.doesNotMatch(account,/view=live|Google Meet link|enable tab audio separately/);
});
