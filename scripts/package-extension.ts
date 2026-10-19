import {mkdirSync,readFileSync,writeFileSync,copyFileSync,rmSync,readdirSync,existsSync} from 'node:fs';
import {resolve,join,relative} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {zipSync,unzipSync} from 'fflate';
import {releaseManifest,RELEASE_VERSION,STORE_EXTENSION_ID} from '../extension/releaseManifest';

const root=resolve(import.meta.dirname,'..');
const folder=join(root,'artifacts',`cuelo-chrome-store-${RELEASE_VERSION}`),output=join(folder,'extension');
const temporary=join(root,'artifacts','tmp');mkdirSync(temporary,{recursive:true});
const filesUnder=(directory:string):string[]=>readdirSync(directory,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?filesUnder(join(directory,entry.name)):[join(directory,entry.name)]);
const checksum=(directory:string)=>createHash('sha256').update(filesUnder(directory).sort().map(file=>relative(directory,file)+':'+createHash('sha256').update(readFileSync(file)).digest('hex')).join('\n')).digest('hex');
const original=checksum(join(root,'extension','meet'));
mkdirSync(folder,{recursive:true});rmSync(output,{recursive:true,force:true});mkdirSync(output,{recursive:true});
for(const name of ['auth-check.html','call.html','sidepanel.css','meeting-state.js','call-end.js','meet-audio-core.js','meet-audio.js','meet-pcm.js'])copyFileSync(join(root,'extension','meet',name),join(output,name));
for(const entry of ['sidebar','call','worker','bridge'])execFileSync(process.execPath,[join(root,'node_modules','vite','bin','vite.js'),'build','--config','vite.extension.config.ts'],{cwd:root,env:{...process.env,TMPDIR:temporary,CUELO_EXTENSION_ENV:'production',CUELO_EXTENSION_OUT_DIR:output,CUELO_EXTENSION_ENTRY:entry},stdio:'inherit'});
mkdirSync(join(output,'fonts'),{recursive:true});
for(const weight of [400,600,700])copyFileSync(join(root,'extension','meet','fonts',`nunito-${weight}.woff2`),join(output,'fonts',`nunito-${weight}.woff2`));
copyFileSync(join(root,'extension','meet','fonts','OFL.txt'),join(output,'fonts','OFL.txt'));
mkdirSync(join(output,'icons'),{recursive:true});
for(const size of [16,32,48,128])execFileSync('sips',['-z',String(size),String(size),join(root,'public','favicon.png'),'--out',join(output,'icons',`icon-${size}.png`)],{stdio:'ignore'});
const manifest=releaseManifest();
const derivedId=createHash('sha256').update(Buffer.from(manifest.key,'base64')).digest('hex').slice(0,32).replace(/[0-9a-f]/g,c=>String.fromCharCode(97+parseInt(c,16)));
if(derivedId!==STORE_EXTENSION_ID)throw Error('Package ID differs from the published Store extension.');
if(!manifest.permissions.includes('tabCapture')||!manifest.permissions.includes('activeTab'))throw Error('Direct meeting-audio permissions are missing.');
writeFileSync(join(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
const entries=Object.fromEntries(filesUnder(output).sort().map(file=>[relative(output,file).replaceAll('\\','/'),new Uint8Array(readFileSync(file))]));
const zip=zipSync(entries,{level:9}),archive=join(folder,`cuelo-${RELEASE_VERSION}-review.zip`);writeFileSync(archive,zip);
const unpacked=unzipSync(zip);if(!unpacked['manifest.json'])throw Error('ZIP must have manifest.json at its root.');
const required=['brand.css','fonts/OFL.txt',...([400,600,700].map(weight=>`fonts/nunito-${weight}.woff2`)),manifest.background.service_worker,manifest.side_panel.default_path,...Object.values(manifest.icons),...manifest.content_scripts.flatMap(script=>script.js),...manifest.web_accessible_resources.flatMap(resource=>resource.resources)];
for(const file of required)if(!unpacked[file])throw Error(`Missing package asset: ${file}`);
for(const name of Object.keys(unpacked)){
 if(/(^|\/)(?:\.env|node_modules|tests?|README|artifacts)/i.test(name))throw Error(`Unexpected file: ${name}`);
 if(name.endsWith('.js')){const text=Buffer.from(unpacked[name]).toString();if(/https:\/\/calculating-gecko-263\.convex\.(?:cloud|site)/.test(text))throw Error(`Development connection in ${name}`);if(/-----BEGIN .*PRIVATE KEY-----|\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}/.test(text))throw Error('Secret-shaped content found; release rejected.');execFileSync(process.execPath,['--check',join(output,name)],{stdio:'pipe'});}
}
for(const size of [16,32,48,128]){const png=readFileSync(join(output,'icons',`icon-${size}.png`));if(png.readUInt32BE(16)!==size||png.readUInt32BE(20)!==size)throw Error('Wrong icon dimensions.');}
const worker=readFileSync(join(output,'shared-auth-worker.js'),'utf8');
if(!worker.includes('https://deafening-frog-846.convex.site'))throw Error('Production sign-in return missing.');
if(checksum(join(root,'extension','meet'))!==original)throw Error('Packaging changed the installed development extension.');
const report={version:RELEASE_VERSION,extensionId:derivedId,permissions:manifest.permissions,environment:'production',archive:relative(root,archive),files:Object.keys(unpacked),bytes:zip.length,sha256:createHash('sha256').update(zip).digest('hex'),developmentBuildUnchanged:true,syntaxAndAssetChecksPassed:true,releaseReady:false,blockers:['Production website/backend must receive the approved latest generic public-search, shortening, explicit exhaustion-message and sign-in compatibility changes before this package is used.','Production listening remains off; exact-package real sign-in/Meet/source/trial acceptance requires separately approved test activation.','Approved local privacy/public-search wording must be published and actual Store privacy/permission fields reviewed before submission.','Refresh and review listing screenshots against this interface; illustrative screenshots are not proof of a real call.','User review and explicit approval are required before upload, submission or publication.']};
writeFileSync(join(folder,'package-review.json'),JSON.stringify(report,null,2)+'\n');
console.log(`Prepared ${relative(root,archive)} (${zip.length} bytes). Development build unchanged. Review-only; not uploaded or deployed.`);
