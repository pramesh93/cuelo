import {createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {ConvexProviderWithAuth,type ConvexReactClient} from 'convex/react';
import {ConvexAuthProvider,useAuthActions as nativeActions,useAuthToken as nativeToken} from '@convex-dev/auth/react';
import {extensionTransport,websiteTransport,type Transport} from './transport';
import {sessionSubject,type Session} from './sharedSession';
type Actions={signIn:(provider?:string,args?:Record<string,unknown>)=>Promise<{signingIn:boolean;redirect?:URL}>;signOut:()=>Promise<void>};
const ActionsContext=createContext<Actions|null>(null),TokenContext=createContext<string|null|undefined>(undefined);
export function useAuthActions(){const shared=useContext(ActionsContext),native=nativeActions();return shared??native;}
export function useAuthToken(){const shared=useContext(TokenContext),native=nativeToken();return shared===undefined?native:shared;}
const completions=new Map<string,Promise<any>>();
export function SharedAuthProvider({client,transport,initial,popup,children,handleCode=false}:{client:ConvexReactClient;transport:Transport;initial?:Session;popup?:(url:string,nonce:string)=>Promise<string>;children:ReactNode;handleCode?:boolean}){
 const [state,setState]=useState<Session>(initial??{token:null,revision:-1,established:false}),current=useRef(state);
 const [loading,setLoading]=useState(!initial),[error,setError]=useState('');
 const accept=useCallback((next:Session)=>{if(next.revision<current.current.revision)return;current.current=next;setState(next);setLoading(false);},[]);
 const load=useCallback(async()=>{const result=await transport.request({operation:'state'});accept(result.state);},[transport,accept]);
 useEffect(()=>{let alive=true;const sync=()=>{void load().catch(()=>{if(alive)setError('Shared sign-in is unavailable. Reload this page or the Cuelo sidebar.');});};const unsubscribe=transport.subscribe(sync);sync();return()=>{alive=false;unsubscribe();};},[transport,load]);
 useEffect(()=>{
  if(!handleCode)return;
  const code=new URLSearchParams(location.search).get('code'),verifier=sessionStorage.getItem('cuelo-website-login-verifier');
  if(!code||!verifier)return;
  const backend=(client as any).address,key=backend+':'+code;
  if(!completions.has(key))completions.set(key,transport.request({operation:'signIn',args:{params:{code},verifier}}));
  void completions.get(key)!.then(result=>{accept(result.state);sessionStorage.removeItem('cuelo-website-login-verifier');const url=new URL(location.href);url.searchParams.delete('code');history.replaceState({},'',url.pathname+url.search+url.hash);}).catch(()=>setError('Google sign-in could not complete. Return to the account page and try again.'));
 },[handleCode,transport,client,accept]);
 const signIn=useCallback(async(provider='google',args:Record<string,unknown>={})=>{
  if(provider!=='google')throw Error('Use Google sign-in only.');
  setError('');
  const nonce=Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');
  const result=await transport.request({operation:'signIn',args:{provider:'google',params:{...args,redirectTo:popup?`/?view=extension-auth&state=${nonce}`:'/?view=account'}}});
  if(result.redirect){
   if(!result.verifier)throw Error('Google sign-in could not start.');
   if(popup){const code=await popup(result.redirect,nonce);const completed=await transport.request({operation:'signIn',args:{params:{code},verifier:result.verifier}});accept(completed.state);return {signingIn:!!completed.state.token};}
   sessionStorage.setItem('cuelo-website-login-verifier',result.verifier);location.assign(result.redirect);return {signingIn:false,redirect:new URL(result.redirect)};
  }
  accept(result.state);return {signingIn:!!result.state.token};
 },[transport,popup,accept]);
 const signOut=useCallback(async()=>{const result=await transport.request({operation:'signOut'});accept(result.state);},[transport,accept]);
 const fetchAccessToken=useCallback(async({forceRefreshToken}:{forceRefreshToken:boolean})=>{
  if(!forceRefreshToken)return current.current.token;
  const result=await transport.request({operation:'refresh',token:current.current.token??undefined});accept(result.state);return current.current.token;
 },[transport,accept,sessionSubject(state.token)]);
 const useSharedAuth=()=>({isLoading:loading,isAuthenticated:!!state.token,fetchAccessToken});
 if(error)return <main className="account-page"><p role="alert">{error}</p><button onClick={()=>location.reload()}>Reload</button></main>;
 return <ActionsContext.Provider value={{signIn,signOut}}><TokenContext.Provider value={state.token}><ConvexProviderWithAuth client={client} useAuth={useSharedAuth}>{children}</ConvexProviderWithAuth></TokenContext.Provider></ActionsContext.Provider>;
}
export function ExtensionAuthProvider({client,popup,children}:{client:ConvexReactClient;popup?:(url:string,nonce:string)=>Promise<string>;children:ReactNode}){
 const [transport]=useState(()=>extensionTransport((client as any).address));
 return <SharedAuthProvider client={client} transport={transport} popup={popup}>{children}</SharedAuthProvider>;
}
export function WebsiteAuthProvider({client,children}:{client:ConvexReactClient;children:ReactNode}){
 const [ready,setReady]=useState<{transport:Transport;state:Session;conflict?:boolean;migrationFailed?:boolean}|{error:string}|false|null>(null);
 useEffect(()=>{let alive=true;
  const backend=(client as any).address as string,transport=websiteTransport(backend),suffix=backend.replace(/[^a-zA-Z0-9]/g,''),jwt='__convexAuthJWT_'+suffix,refresh='__convexAuthRefreshToken_'+suffix;
  void transport.request({operation:'probe'}).then(()=>transport.request({operation:'state'})).then(async result=>{
   const token=localStorage.getItem(jwt),refreshToken=localStorage.getItem(refresh);
   if(token&&refreshToken&&!result.state.established){
    try{result=await transport.request({operation:'import',tokens:{token,refreshToken}});}catch{if(alive)setReady({transport,state:result.state,migrationFailed:true});return;}
   }
   if(token&&result.state.token&&sessionSubject(token)?.split('|')[0]!==sessionSubject(result.state.token)?.split('|')[0]){
    // Never silently switch an already signed-in website to a different account.
    if(alive)setReady({transport,state:result.state,conflict:true});
    return;
   }
   localStorage.removeItem(jwt);localStorage.removeItem(refresh);
   if(alive)setReady({transport,state:result.state});
  }).catch(error=>{if(alive)setReady(String(error.message).includes('extension did not respond')?false:{error:'Cuelo could not check the shared sign-in. Reload this page and the extension.'});});
  return()=>{alive=false;};
 },[client]);
 if(ready===null)return <main><p role="status">Checking your Cuelo sign-in…</p></main>;
 if(ready===false)return <ConvexAuthProvider client={client}>{children}</ConvexAuthProvider>;
 if('error' in ready)return <main className="account-page"><p role="alert">{ready.error}</p><button onClick={()=>location.reload()}>Reload</button></main>;
 if(ready.conflict||ready.migrationFailed)return <main className="account-page"><h1>{ready.conflict?'Choose one Cuelo account.':'Connect your Cuelo sign-in.'}</h1><p>{ready.conflict?'Your website and sidebar were signed into different accounts.':'Your previous website sign-in could not be connected. Reload to retry, or sign out of both and sign in again.'}</p>{ready.conflict&&<button onClick={()=>{const suffix=((client as any).address as string).replace(/[^a-zA-Z0-9]/g,'');localStorage.removeItem('__convexAuthJWT_'+suffix);localStorage.removeItem('__convexAuthRefreshToken_'+suffix);setReady({...ready,conflict:false});}}>Use the sidebar account</button>}<button onClick={()=>{void ready.transport.request({operation:'signOut'}).then(result=>{const suffix=((client as any).address as string).replace(/[^a-zA-Z0-9]/g,'');localStorage.removeItem('__convexAuthJWT_'+suffix);localStorage.removeItem('__convexAuthRefreshToken_'+suffix);setReady({transport:ready.transport,state:result.state});}).catch(()=>setReady({error:'Cuelo could not sign out. Check your connection and reload.'}));}}>Sign out of both</button></main>;
 return <SharedAuthProvider client={client} transport={ready.transport} initial={ready.state} handleCode>{children}</SharedAuthProvider>;
}
