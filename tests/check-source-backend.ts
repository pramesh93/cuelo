import {readFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import assert from 'node:assert/strict';
import {ConvexHttpClient} from 'convex/browser';
import {api} from '../convex/_generated/api';
import {zipSync,strToU8} from 'fflate';
import {examplePdf} from './source-fixtures';
const settings=await readFile('.env.local','utf8');const url=settings.match(/^(?:VITE_)?CONVEX_URL=(.+)$/m)?.[1]?.replace(/^['"]|['"]$/g,'');if(!url)throw new Error('Missing development URL.');
const client=new ConvexHttpClient(url);const guestSecret=randomBytes(32).toString('hex');let id:any=null;
try{
const pdf=examplePdf(2);const ticket=await client.action(api.sourceImport.prepareUpload,{guestSecret,expectedId:null,name:'example.pdf',size:pdf.length});const response=await fetch(ticket.url,{method:'POST',headers:{Authorization:`Bearer ${ticket.token}`},body:pdf as BodyInit});const result=await response.json();assert.equal(response.ok,true,JSON.stringify(result));id=result.id;assert.equal(result.pageCount,2);
const passages=await client.query(api.sources.passages,{guestSecret,id});assert.deepEqual(passages.map(p=>p.reference),['Page 1','Page 2']);
const reused=await fetch(ticket.url,{method:'POST',headers:{Authorization:`Bearer ${ticket.token}`},body:pdf as BodyInit});assert.equal(reused.ok,false);
const large=zipSync({'word/document.xml':strToU8('<w:document xmlns:w="urn:w"><w:body><w:p><w:r><w:t>Made-up large Word source.</w:t></w:r></w:p></w:body></w:document>'),'docProps/app.xml':strToU8('<Properties><Pages>1</Pages></Properties>'),'unused-padding.bin':new Uint8Array(10*1024*1024-2048)},{level:0});
assert.ok(large.length>5*1024*1024&&large.length<=10*1024*1024);
const largeTicket=await client.action(api.sourceImport.prepareUpload,{guestSecret,expectedId:id,name:'large-example.docx',size:large.length});const largeResponse=await fetch(largeTicket.url,{method:'POST',headers:{Authorization:`Bearer ${largeTicket.token}`},body:large as BodyInit});const largeResult=await largeResponse.json();assert.equal(largeResponse.ok,true,JSON.stringify(largeResult));id=largeResult.id;
await assert.rejects(()=>client.action(api.sourceImport.prepareUpload,{guestSecret,expectedId:id,name:'too-large.pdf',size:10*1024*1024+1}),/10 MB/);
const oversized=examplePdf(51);const oversizedTicket=await client.action(api.sourceImport.prepareUpload,{guestSecret,expectedId:id,name:'too-many-pages.pdf',size:oversized.length});const oversizedResponse=await fetch(oversizedTicket.url,{method:'POST',headers:{Authorization:`Bearer ${oversizedTicket.token}`},body:oversized as BodyInit});assert.equal(oversizedResponse.ok,false);assert.match((await oversizedResponse.json()).error,/50 pages/);assert.equal((await client.query(api.sources.get,{guestSecret}))?.id,id);
const webpage=await client.action(api.sourceImport.webpage,{guestSecret,expectedId:id,url:'https://slack.com/help/articles/203772216-SAML-single-sign-on'});id=webpage.id;assert.ok(webpage.passageCount>0);
assert.equal(await client.query(api.sources.get,{guestSecret:'b'.repeat(64)}),null);
await assert.rejects(()=>client.mutation(api.sources.keep,{guestSecret,expectedId:id,replaceSaved:false}),/Sign in/);
console.log('Real development backend passed: PDF extraction, nearly 10 MB Word upload, oversized-file/51-page rejection, one-use upload, public-page import, anonymous isolation and signed-out save denial.');
}finally{if(id)await client.mutation(api.sources.remove,{guestSecret,expectedId:id});}
