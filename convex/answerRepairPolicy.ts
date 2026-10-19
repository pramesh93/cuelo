export type AnswerShape='route'|'public'|'selected';
export function parseAnswerJSON(text:string):any {
 try{const raw=JSON.parse(text.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,''));if(raw&&typeof raw==='object')delete raw.shorteningTimedOut;return raw;}catch{return null;}
}
export function answerWords(raw:any){return Array.isArray(raw?.bullets)?raw.bullets.map((b:any)=>typeof b?.text==='string'?b.text.trim():'').join(' ').trim().split(/\s+/u).filter(Boolean).length:0;}
export function needsAnswerRepair(raw:any,shape:AnswerShape,mode:'generic'|'document'){
 if(!raw||typeof raw!=='object')return true;
 if(shape==='route'&&raw.status==='search')return typeof raw.publicQuestion!=='string'||!raw.publicQuestion.trim();
 if(raw.status==='unverified'||raw.status==='conflict')return false;
 if(raw.status!==(mode==='document'?'supported':'generic')||!Array.isArray(raw.bullets)||!raw.bullets.length||raw.bullets.length>3)return true;
 if(answerWords(raw)>40)return true;
 if(shape!=='public'&&mode==='generic'&&raw.companySpecific!==false)return true;
 return raw.bullets.some((b:any)=>!b||typeof b.text!=='string'||!b.text.trim()||/[<>]/.test(b.text)||(shape==='public'?(b.sourceIds!=null&&(!Array.isArray(b.sourceIds)||b.sourceIds.length>3)):!Array.isArray(b.passageIds)));
}

// Compression must not change numerical facts or drop essential qualifications.
// This is an additional conservative check, not a semantic proof.
export function repairPreservesDetails(before:any,after:any,scope:'document'|'public'|'generic'='document'){
 if(!Array.isArray(before?.bullets)||!Array.isArray(after?.bullets))return true;
 const text=(raw:any)=>raw.bullets.map((b:any)=>typeof b?.text==='string'?b.text:'').join(' ');
 const original=text(before),shortened=text(after);
 const numbers=(s:string)=>new Set(s.match(/\d+(?:[.,]\d+)*/g)??[]);
 const oldNumbers=numbers(original),newNumbers=numbers(shortened);
 if([...oldNumbers].some(n=>!newNumbers.has(n))||[...newNumbers].some(n=>!oldNumbers.has(n)))return false;
 const factualQualifiers=[/\$|\bUSD\b/i,/€|\bEUR\b/i,/₹|\bINR\b/i,/£|\bGBP\b/i,/\b(?:monthly|month)\b/i,/\b(?:annual(?:ly)?|year(?:ly)?)\b/i,/\bper[ -]user\b/i,/\bunless\b/i,/\bexcept\b/i,/\bonly if\b/i,/\bprovided that\b/i];
 // Ordinary explanations can express the same benefit positively: e.g.
 // 'do not need separate logins' becomes 'one sign-in across multiple apps'.
 // Keep strict evidence/negation wording checks for documents and sourced facts.
 const qualifiers=scope==='generic'?factualQualifiers:[...factualQualifiers,/\b(?:only if|if|provided|requires?|needs?)\b/i,/\b(?:not|no|never|unavailable)\b/i];
 return qualifiers.every(pattern=>!pattern.test(original)||pattern.test(shortened));
}
