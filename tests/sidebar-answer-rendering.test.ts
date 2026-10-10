import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {mkdirSync,writeFileSync} from 'node:fs';
import {AnswerCard} from '../src/AnswerCheck';
const passage={ordinal:0,reference:'Business plan',text:'Business includes Salesforce integration.'};
const source={id:'fictional-source' as any,title:'Fictional FAQ',kind:'text' as const,url:null,pageCount:null,passageCount:1,saved:true,expiresAt:null};
const base={question:'Which plan includes Salesforce?',mode:'document' as const,status:'supported' as const,bullets:['Business includes Salesforce integration.'],message:'',citations:[passage],source,elapsedMs:100,budgetAlert:false};
test('every generic card visibly labels provenance, including retained/replayed and error cards',()=>{
 for(const status of ['generic','error','unverified'] as const){
  const card=renderToStaticMarkup(createElement(AnswerCard,{result:{...base,mode:'generic',status,source:null,citations:[],bullets:status==='generic'?['General guidance.']:[],message:status==='error'?'Busy right now. Try again in a few minutes.':''},sourceLinks:false}));
  assert.match(card,/<p class="provenance">Not from your document<\/p>/);
  assert.doesNotMatch(card,/Open supporting passage|blockquote|class="citation"/);
 }
});
test('document card exposes the exact cited passage and real reference without a generic label',()=>{
 const card=renderToStaticMarkup(createElement(AnswerCard,{result:base,sourceLinks:false}));
 assert.match(card,/<summary>Open supporting passage<\/summary>/);
 assert.match(card,/<h3>Business plan<\/h3><blockquote>Business includes Salesforce integration\.<\/blockquote>/);
 assert.match(card,/Business plan<br\/>Fictional FAQ/);assert.doesNotMatch(card,/Not from your document/);
 mkdirSync('artifacts',{recursive:true});
 writeFileSync('artifacts/sidebar-evidence-check.html','<!doctype html><title>SIMULATED sidebar answer check</title><main><p>SIMULATED answers; no audio or providers connected.</p>'+card+renderToStaticMarkup(createElement(AnswerCard,{result:{...base,mode:'generic',status:'generic',source:null,citations:[]},sourceLinks:false}))+'</main>');
});
test('missing document answer and service failure render their specific messages without invented evidence',()=>{
 for(const result of [
  {...base,status:'unverified' as const,bullets:[],citations:[],message:"I couldn't find this in your source."},
  {...base,status:'error' as const,bullets:[],citations:[],message:'Busy right now. Try again in a few minutes.'},
 ]){
  const card=renderToStaticMarkup(createElement(AnswerCard,{result,sourceLinks:false}));
  assert.doesNotMatch(card,/blockquote|Open supporting passage/);
  assert.match(card,result.status==='error'?/role="alert">Busy right now/:/I couldn&#x27;t find this in your source/);
 }
});
