// Real development backend only: no provider work is authorised by this check.
import {readFile} from 'node:fs/promises';
import {randomBytes,randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {ConvexHttpClient} from 'convex/browser';
import {api} from '../convex/_generated/api';
const settings=await readFile('.env.local','utf8');const url=settings.match(/^(?:VITE_)?CONVEX_URL=(.+)$/m)?.[1]?.replace(/^['"]|['"]$/g,'');if(!url)throw new Error('Missing development URL.');const client=new ConvexHttpClient(url);const secret=randomBytes(32).toString('hex');
const status=await client.query(api.selectedAnswerBudget.status,{visitSecret:secret});assert.equal(status.enabled,false,'This check must never run with paid testing enabled.');
const source=await client.action(api.sourceImport.paste,{guestSecret:secret,expectedId:null,title:'Made-up answer-check FAQ',text:'The made-up product supports password sign-in.'});
try{const document=await client.action(api.selectedAnswers.ask,{visitSecret:secret,guestSecret:secret,requestKey:randomUUID(),mode:'document',sourceId:source.id,question:'Does the made-up product support password sign-in?'});assert.equal(document.status,'error');assert.match(document.message,/not enabled/);
 const generic=await client.action(api.selectedAnswers.ask,{visitSecret:secret,requestKey:randomUUID(),mode:'generic',question:'What is single sign-on?'});assert.equal(generic.mode,'generic');assert.equal(generic.status,'error');assert.equal(generic.source,null);
 const foreign=await client.action(api.selectedAnswers.ask,{visitSecret:'b'.repeat(64),guestSecret:'b'.repeat(64),requestKey:randomUUID(),mode:'document',sourceId:source.id,question:'What does the source say?'});assert.equal(foreign.status,'error');assert.match(foreign.message,/deleted|expired/);
 const after=await client.query(api.selectedAnswerBudget.status,{visitSecret:secret});assert.equal(after.attemptsRemaining,status.attemptsRemaining);assert.equal(after.remaining,5);console.log('Real development checks passed: owned source, disabled paid admission, generic provenance, source isolation and unchanged attempt counters. No AI provider requests.');
}finally{await client.mutation(api.sources.remove,{guestSecret:secret,expectedId:source.id});}
