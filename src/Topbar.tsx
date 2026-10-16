import {CueloWordmark} from './CueloWordmark';
import {useEffect,useState} from 'react';
import {useConvexAuth} from 'convex/react';
import {accountLink} from './auth/navigation';
import {useAuthActions} from './auth/SharedAuth';
export function AccountNavigation({signedIn,loading=false,next,onSignOut,busy=false}:{signedIn:boolean;loading?:boolean;next?:'sources';onSignOut?:()=>void;busy?:boolean}){
 if(loading)return <span role="status">Checking account…</span>;
 return signedIn?<><a href="/?view=sources">My source</a><a href="/?view=account">My account</a><button type="button" className="text-button" onClick={onSignOut} disabled={busy}>{busy?'Signing out…':'Sign out'}</button></>:<><a href={accountLink('signup',next)}>Sign up</a><a href={accountLink('login',next)}>Sign in</a></>;
}
export function Topbar({home=false}:{home?:boolean}){
 const {isAuthenticated,isLoading}=useConvexAuth();
 const {signOut}=useAuthActions();
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 async function logout(){setBusy(true);setError('');try{await signOut();}catch{setError('We couldn’t sign you out. Please try again.');}finally{setBusy(false);}}
 const next=typeof location!=='undefined'&&new URLSearchParams(location.search).get('view')==='sources'?'sources':undefined;
 const [compact,setCompact]=useState(false);
 useEffect(()=>{const update=()=>setCompact(window.scrollY>32);update();window.addEventListener('scroll',update,{passive:true});return()=>window.removeEventListener('scroll',update);},[]);
 return <header className={`site-header ${compact?'compact':''}`}><a className="wordmark brand-link" href="/" aria-label="Cuelo home"><CueloWordmark/></a><nav aria-label="Main">{home&&<div className="landing-nav-links"><a href="#features">Features</a><a href="#about">About us</a><a href="#pricing">Pricing</a></div>}{!home&&<a className="nav-back" href="/">Home</a>}<div className="account-nav-links"><AccountNavigation signedIn={isAuthenticated} loading={isLoading&&!home} next={next} onSignOut={logout} busy={busy}/></div>{error&&<span role="alert">{error}</span>}</nav></header>;
}
export function MicIcon(){return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 10v2a6 6 0 0 0 12 0v-2M12 18v3M9 21h6"/></svg>;}
export function CallIcon(){return <svg viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="6" width="12" height="12" rx="3"/><path d="m15 10 6-3v10l-6-3"/></svg>;}
