import {test} from 'node:test';import assert from 'node:assert/strict';
import {createElement} from 'react';import {renderToStaticMarkup} from 'react-dom/server';
import {CallDownloads,chromeStoreLink} from '../src/CallDownloads';
test('download chooser shows unavailable desktop apps and a truthful unpublished Chrome state',()=>{
 const html=renderToStaticMarkup(createElement(CallDownloads,{onClose:()=>{},listing:''}));assert.match(html,/Cuelo for Windows/);assert.match(html,/Cuelo for Mac/);assert.match(html,/Coming soon to the Chrome Web Store/);assert.equal((html.match(/disabled/g)||[]).length,3);assert.doesNotMatch(html,/href=/);
});
test('only a real HTTPS Chrome Web Store detail URL enables the extension link',()=>{
 const url='https://chromewebstore.google.com/detail/cuelo/abcdefghijklmnopabcdefghijklmnop';assert.equal(chromeStoreLink(url),url);
 for(const bad of ['javascript:alert(1)','https://chromewebstore.google.com.evil.test/detail/cuelo','http://chromewebstore.google.com/detail/cuelo','https://example.com','https://chromewebstore.google.com/'])assert.equal(chromeStoreLink(bad),null);
 const html=renderToStaticMarkup(createElement(CallDownloads,{onClose:()=>{},listing:url}));assert.match(html,/href="https:\/\/chromewebstore/);assert.equal((html.match(/disabled/g)||[]).length,2);
});
