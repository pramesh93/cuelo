"use node";
export const SHORTENING_MS=10000;
export const ANSWER_TOO_LONG='Answer too long. Refer to the source below.';
export type ShorteningState={shortening?:{deadline:number;controller:AbortController;timer:ReturnType<typeof setTimeout>};shorteningRemainingMs?:number};
export class ShorteningTimeout extends Error {constructor(){super('Shortening exceeded ten seconds.');this.name='ShorteningTimeout';}}
export function beginShortening(state:ShorteningState){
 if(state.shortening)return;
 const remaining=state.shorteningRemainingMs??SHORTENING_MS,controller=new AbortController();
 state.shortening={deadline:Date.now()+remaining,controller,timer:setTimeout(()=>controller.abort(new ShorteningTimeout()),remaining)};
 if(remaining<=0)controller.abort(new ShorteningTimeout());
}
export function endShortening(state:ShorteningState){
 if(!state.shortening)return;
 clearTimeout(state.shortening.timer);state.shorteningRemainingMs=Math.max(0,state.shortening.deadline-Date.now());delete state.shortening;
}
export async function duringShortening<T>(state:ShorteningState,parent:AbortSignal,work:(signal:AbortSignal)=>Promise<T>):Promise<T>{
 const window=state.shortening;if(!window)return work(parent);
 if(parent.aborted)throw parent.reason;
 if(Date.now()>=window.deadline)throw new ShorteningTimeout();
 const signal=AbortSignal.any([parent,window.controller.signal]);
 if(signal.aborted)throw signal.reason;
 return new Promise<T>((resolve,reject)=>{
  const abort=()=>reject(signal.reason);signal.addEventListener('abort',abort,{once:true});
  Promise.resolve().then(()=>{if(signal.aborted)throw signal.reason;return work(signal);}).then(resolve,reject).finally(()=>signal.removeEventListener('abort',abort));
 });
}
export const shorteningFallback=()=>({status:'unverified',companySpecific:false,bullets:[],shorteningTimedOut:true});
