const codes=['repair_started','repair_attempt','repair_rejected_length','repair_rejected_structure','repair_rejected_details','repair_rejected_refusal','repair_accepted','shortening_timeout','routing_search','routing_generic','routing_unverified','routing_invalid','search_generic','search_unverified','search_invalid','missing_provider_sources','missing_bullets','missing_source_urls','unmatched_source_urls','final_accepted','final_word_limit','final_company_marker','final_shape','final_unverified','final_other'] as const;
export type PublicDiagnosticCode=typeof codes[number];
const fields=['sourceCount','inlineCount','toolResultCount','providerExecutedCount','bulletCount','wordCount','originalWordCount','attemptCount','elapsedMs'] as const;
export function publicDiagnostic(code:PublicDiagnosticCode,metrics:Partial<Record<typeof fields[number],number>>={}){
 if(process.env.CONVEX_CLOUD_URL!=='https://calculating-gecko-263.convex.cloud'||process.env.PUBLIC_SEARCH_DIAGNOSTICS_ENABLED!=='true'||!codes.includes(code))return;
 const safe:Record<string,number>={};for(const key of fields){const value=metrics[key];if(Number.isSafeInteger(value)&&value!>=0)safe[key]=value!;}
 console.info('CueloPublicCheck',JSON.stringify({code,...safe}));
}
export function finalPublicDiagnostic(raw:unknown,accepted:boolean){
 if(accepted)return publicDiagnostic('final_accepted');
 if(!raw||typeof raw!=='object')return publicDiagnostic('final_shape');
 const value=raw as any;if(value.shorteningTimedOut===true)return publicDiagnostic('shortening_timeout');if(value.status==='unverified')return publicDiagnostic('final_unverified');
 const bullets=Array.isArray(value.bullets)?value.bullets:[];const wordCount=bullets.map((b:any)=>typeof b?.text==='string'?b.text.trim():'').join(' ').trim().split(/\s+/).filter(Boolean).length;
 publicDiagnostic(wordCount>40?'final_word_limit':value.companySpecific!==false?'final_company_marker':!bullets.length||bullets.length>3?'final_shape':'final_other',{bulletCount:bullets.length,wordCount});
}
