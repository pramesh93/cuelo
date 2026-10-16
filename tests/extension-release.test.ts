import {createHash} from 'node:crypto';
import {test} from 'node:test';import assert from 'node:assert/strict';
import {releaseManifest,RELEASE_VERSION,STORE_EXTENSION_ID} from '../extension/releaseManifest';
import {execFileSync} from 'node:child_process';import {readFileSync,mkdirSync} from 'node:fs';import {resolve} from 'node:path';
test('public release manifest requests only production and Meet access, with required brand metadata',()=>{
 const manifest=releaseManifest();assert.equal(manifest.name,'Cuelo');assert.equal(RELEASE_VERSION,'0.1.2');const id=createHash('sha256').update(Buffer.from(manifest.key,'base64')).digest('hex').slice(0,32).replace(/[0-9a-f]/g,c=>String.fromCharCode(97+parseInt(c,16)));assert.equal(id,STORE_EXTENSION_ID);assert.equal(id,'hoafcdkncbacbngcdnamefjhelijkpbm');assert.ok(manifest.description.length<=132);assert.deepEqual(manifest.permissions,['sidePanel','storage','offscreen','scripting','tabCapture','activeTab']);assert.equal(manifest.host_permissions.length,3);assert.ok(manifest.host_permissions.every(x=>!x.includes('calculating-gecko')&&!x.includes('127.0.0.1')));assert.equal(manifest.content_scripts[1].matches[0],'https://deafening-frog-846.convex.site/*');assert.ok(manifest.icons[128]);
});
test('isolated production worker embeds production Google callbacks even when the installed extension config is development',()=>{
 const before=readFileSync('extension/meet/auth-config.js','utf8');const output=resolve('artifacts/store-worker-regression');mkdirSync('artifacts/tmp',{recursive:true});
 execFileSync(process.execPath,['node_modules/vite/bin/vite.js','build','--config','vite.extension.config.ts'],{env:{...process.env,TMPDIR:resolve('artifacts/tmp'),CUELO_EXTENSION_ENV:'production',CUELO_EXTENSION_ENTRY:'worker',CUELO_EXTENSION_OUT_DIR:output},stdio:'pipe'});
 const worker=readFileSync(resolve(output,'shared-auth-worker.js'),'utf8');assert.ok(worker.includes('https://deafening-frog-846.convex.site'));assert.ok(!worker.includes('https://calculating-gecko-263.convex.site'));assert.equal(readFileSync('extension/meet/auth-config.js','utf8'),before);assert.match(readFileSync(resolve(output,'auth-config.js'),'utf8'),/returnOrigin.*https:\/\/deafening-frog-846/);
});
