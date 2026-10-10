export type Tokens={token:string;refreshToken:string};
export type Session={token:string|null;revision:number;established:boolean};
export type Stored=Session&{refreshToken:string|null;attempts?:Record<string,number>};
export type AuthRequest={operation:'probe'|'state'|'import'|'signIn'|'refresh'|'signOut';args?:Record<string,unknown>;token?:string;tokens?:Tokens};
export type AuthResult={state:Session;redirect?:string;verifier?:string};
export const sessionKey=(backend:string)=>'cuelo-shared-session:'+backend;
export function sessionSubject(token:string|null){try{return JSON.parse(atob(token!.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).sub as string;}catch{return null;}}
export function allowedWebsite(origin:string,backend:string){
 return origin===backend.replace('.convex.cloud','.convex.site')||(backend.includes('calculating-gecko-263')&&origin==='http://127.0.0.1:5173');
}
export function createSharedSession(deps:{backend:string;load:()=>Promise<Stored|null>;save:(s:Stored)=>Promise<void>;legacy:()=>Promise<Tokens|null>;call:(name:'signIn'|'signOut',args:Record<string,unknown>,token:string|null)=>Promise<any>;validate:(token:string)=>Promise<boolean>;stopCall:()=>Promise<void>}){
 let queue=Promise.resolve();
 const publicState=(s:Stored):Session=>({token:s.token,revision:s.revision,established:s.established});
 async function handle(request:AuthRequest):Promise<AuthResult>{
  let s=await deps.load();
  if(!s){
   const legacy=await deps.legacy();
   s={token:legacy?.token??null,refreshToken:legacy?.refreshToken??null,revision:0,established:!!legacy};
   await deps.save(s);
  }
  async function store(tokens:Tokens|null,clearAttempts=false){
   if(sessionSubject(s!.token)!==sessionSubject(tokens?.token??null))await deps.stopCall();
   s={token:tokens?.token??null,refreshToken:tokens?.refreshToken??null,revision:s!.revision+1,established:true,...(!clearAttempts&&tokens?{attempts:s!.attempts}:{})};
   await deps.save(s);
  }
  if(request.operation==='state')return {state:publicState(s)};
  if(request.operation==='import'){
   if(s.established)return {state:publicState(s)};
   const tokens=request.tokens;
   if(!tokens||typeof tokens.token!=='string'||typeof tokens.refreshToken!=='string'||tokens.token.length>20000||tokens.refreshToken.length>20000)throw Error('Invalid existing sign-in.');
   if(!await deps.validate(tokens.token))throw Error('Your previous website sign-in expired. Sign in again.');
   const refreshed=await deps.call('signIn',{refreshToken:tokens.refreshToken},null);
   if(!refreshed.tokens||sessionSubject(refreshed.tokens.token)?.split('|')[0]!==sessionSubject(tokens.token)?.split('|')[0])throw Error('Your previous website sign-in expired. Sign in again.');
   await store(refreshed.tokens);return {state:publicState(s)};
  }
  if(request.operation==='signOut'){
   const token=s.token;await store(null);
   try{await deps.call('signOut',{},token);}catch{/* Local logout remains authoritative during a network outage. */}
   return {state:publicState(s)};
  }
  if(request.operation==='refresh'){
   if(!s.refreshToken||request.token!==s.token)return {state:publicState(s)};
   const result=await deps.call('signIn',{refreshToken:s.refreshToken},null);
   await store(result.tokens??null);return {state:publicState(s)};
  }
  if(request.operation==='signIn'){
   const args=request.args??{};
   if(args.provider!==undefined&&args.provider!=='google')throw Error('Use Google sign-in only.');
   if('refreshToken' in args||('code' in args))throw Error('Invalid sign-in request.');
   const params=args.params as Record<string,unknown>|undefined;
   if(args.provider==='google'&&params?.code!==undefined)throw Error('Complete only the original sign-in attempt.');
   if(args.provider!=='google'&&!(typeof params?.code==='string'&&typeof args.verifier==='string'))throw Error('Invalid sign-in completion.');
   if(params?.redirectTo!==undefined){
    if(typeof params.redirectTo!=='string'||!params.redirectTo.startsWith('/?view=')||params.redirectTo.startsWith('//'))throw Error('Invalid sign-in return.');
   }
   if(args.provider!=='google'){
    if(typeof params?.code!=='string'||params.code.length>2048||typeof args.verifier!=='string'||!((s.attempts?.[args.verifier]??0)>Date.now()))throw Error('This sign-in attempt expired or was cancelled.');
    const attempts={...s.attempts};delete attempts[args.verifier];s={...s,attempts};await deps.save(s);
   }
   const result=await deps.call('signIn',args,s.token);
   if(result.redirect){
    if(typeof result.verifier!=='string'||result.verifier.length>20000)throw Error('Invalid sign-in verifier.');
    const attempts=Object.fromEntries(Object.entries(s.attempts??{}).filter(([,until])=>until>Date.now()).slice(-3));
    attempts[result.verifier]=Date.now()+180000;s={...s,attempts};await deps.save(s);
   }
   if(result.tokens!==undefined)await store(result.tokens,true);
   return {state:publicState(s),...(result.redirect?{redirect:result.redirect,verifier:result.verifier}:{})};
  }
  throw Error('Unknown shared sign-in action.');
 }
 return {run(request:AuthRequest){const result=queue.then(()=>handle(request));queue=result.then(()=>{},()=>{});return result;}};
}

export function authSenderAllowed(sender:{id?:string;url?:string;frameId?:number},extensionId:string,backend:string){
 if(sender.id!==extensionId)return false;
 if(sender.url===`chrome-extension://${extensionId}/auth-check.html`||sender.url===`chrome-extension://${extensionId}/call.html`)return true;
 try{return sender.frameId===0&&allowedWebsite(new URL(sender.url!).origin,backend);}catch{return false;}
}
