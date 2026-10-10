// Provider messages are untrusted. Only completed, confident turns enter call context.
export function createUtteranceAssembler(options:{speaker:'customer'|'salesperson';onTurn:(text:string)=>void;onCustomerSpeech:()=>void;onFailure:(message:string)=>void}){
 let parts:string[]=[],seen=new Set<string>(),started=false,latestFinalStart=-Infinity;
 function begin(){if(!started){started=true;if(options.speaker==='customer')options.onCustomerSpeech();}}
 function flush(){const text=parts.join(' ').trim();parts=[];seen.clear();started=false;if(text)options.onTurn(text);}
 return (raw:unknown)=>{
  if(!raw||typeof raw!=='object')return;const m=raw as Record<string,any>;
  if(m.type==='SpeechStarted'){begin();return;}
  if(m.type==='UtteranceEnd'){flush();return;}
  if(m.type!=='Results')return;
  const alternative=m.channel?.alternatives?.[0];if(typeof alternative?.transcript!=='string')return;
  const text=alternative.transcript.trim();
  // A later repetition has a new timestamp; provider replay of the same final
  // segment must not become another question after a previous flush.
  if(m.is_final===true&&typeof m.start==='number'&&Number.isFinite(m.start)){if(m.start<=latestFinalStart){if(m.speech_final===true)flush();return;}latestFinalStart=m.start;}
  if(text)begin();
  if(m.is_final===true&&text&&typeof alternative.confidence==='number'&&alternative.confidence>=.5){
   const key=typeof m.start==='number'?String(m.start):text;
   if(!seen.has(key)){seen.add(key);parts.push(text);}
   if(parts.join(' ').length>2000){options.onFailure('That spoken turn exceeds the call text limit. Cuelo stopped; ask a shorter question.');parts=[];return;}
  }
  if(m.is_final===true&&m.speech_final===true)flush();
 };
}
