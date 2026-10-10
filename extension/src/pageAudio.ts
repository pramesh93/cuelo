import {decodeMeetingFrame} from '../../src/extensionProtocol';
type Speaker='customer'|'salesperson';
type Message=Record<string,any>;
type Listener=(message:Message,sender:{id?:string},reply:(result:unknown)=>void)=>boolean|void;
type Browser={id:string;sendMessage:(message:Message)=>Promise<Message>;onMessage:{addListener:(listener:Listener)=>void;removeListener:(listener:Listener)=>void}};
export type AudioStats={customerFrames:number;microphoneFrames:number;customerMaxGapMs:number;microphoneMaxGapMs:number;meetingTracks?:number;microphoneState?:string};
export async function preparePageAudio(options:{browser:Browser;nonce:string;signal:AbortSignal;onFailure:(message:string)=>void;now?:()=>number}){
 const {browser,nonce,signal}=options,now=options.now??(()=>performance.now());let active=true;const receive:Partial<Record<Speaker,(frame:ArrayBuffer)=>void>>={};const sequence={customer:0,salesperson:0},last:Partial<Record<Speaker,number>>={},gap={customer:0,salesperson:0};
 const control=(type:string,extra:Message={})=>browser.sendMessage({type:'meet-audio-control',operation:type,nonce,...extra});
 const stop=()=>{if(!active)return;active=false;browser.onMessage.removeListener(listener);signal.removeEventListener('abort',stop);delete receive.customer;delete receive.salesperson;void control('stop').catch(()=>{});};
 const fail=()=>{stop();options.onFailure('Meeting audio was interrupted or unreadable. Cuelo stopped.');};
 const listener:Listener=(message,sender,reply)=>{
  if(sender.id!==browser.id||message.to!=='call'||message.type!=='audio-frame'||message.nonce!==nonce)return;
  if(!active){reply({error:'Audio stopped.'});return;}
  try{const speaker=message.speaker as Speaker;if(!['customer','salesperson'].includes(speaker)||!Number.isSafeInteger(message.sequence)||message.sequence!==sequence[speaker]+1)throw Error('Old or missing audio.');const frame=decodeMeetingFrame(message.frame);const at=now();if(last[speaker]!==undefined)gap[speaker]=Math.max(gap[speaker],at-last[speaker]!);last[speaker]=at;sequence[speaker]=message.sequence;receive[speaker]?.(frame);reply({});}catch{fail();reply({error:'Unreadable audio.'});}return true;
 };
 browser.onMessage.addListener(listener);signal.addEventListener('abort',stop,{once:true});
 try{if(signal.aborted)throw new DOMException('Cancelled','AbortError');const result=await control('prepare');if(result.error)throw Error(result.error);if(!active||signal.aborted)throw new DOMException('Cancelled','AbortError');return {
  stop,
  frames:(speaker:Speaker)=>(callback:(frame:ArrayBuffer)=>void)=>{if(!active)throw Error('Audio stopped.');receive[speaker]=callback;return()=>{if(receive[speaker]===callback)delete receive[speaker];};},
  stream:async(deadline:number)=>{if(!active)throw new DOMException('Cancelled','AbortError');const result=await control('stream',{deadline});if(result.error)throw Error(result.error);if(!active)throw new DOMException('Cancelled','AbortError');},
  stats:():AudioStats=>({customerFrames:sequence.customer,microphoneFrames:sequence.salesperson,customerMaxGapMs:Math.round(gap.customer),microphoneMaxGapMs:Math.round(gap.salesperson)}),
 };}catch(error){stop();throw error;}
}
