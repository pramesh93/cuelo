import {test} from 'node:test';import assert from 'node:assert/strict';import {extensionEnvironment} from '../extension/environment';
test('sidebar defaults to separate test storage even when website variables point to production',()=>{
 const config=extensionEnvironment({VITE_CONVEX_URL:'https://deafening-frog-846.convex.cloud',CONVEX_URL:'https://deafening-frog-846.convex.cloud'});
 assert.equal(config.backend,'https://calculating-gecko-263.convex.cloud');assert.equal(config.siteOrigin,'https://calculating-gecko-263.convex.site');assert.equal(config.returnOrigin,'http://127.0.0.1:5173');
});
test('live storage requires explicit selection; unknown selections fail rather than connecting elsewhere',()=>{
 assert.equal(extensionEnvironment({CUELO_EXTENSION_ENV:'production'}).backend,'https://deafening-frog-846.convex.cloud');assert.throws(()=>extensionEnvironment({CUELO_EXTENSION_ENV:'typo'}));
});
