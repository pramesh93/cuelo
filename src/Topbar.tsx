import {useEffect,useState} from 'react';
export function Topbar({home=false}:{home?:boolean}){
 const [compact,setCompact]=useState(false);
 useEffect(()=>{const update=()=>setCompact(window.scrollY>32);update();window.addEventListener('scroll',update,{passive:true});return()=>window.removeEventListener('scroll',update);},[]);
 return <header className={`site-header ${compact?'compact':''}`}><a className="wordmark brand-link" href="/" aria-label="Cuelo home">Cuelo<span className="brand-dot" aria-hidden="true"/></a><nav aria-label="Main">{home?<a className="nav-login" href="/?view=account">Log in</a>:<a className="nav-back" href="/">Back to Cuelo</a>}</nav></header>;
}
export function MicIcon(){return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 10v2a6 6 0 0 0 12 0v-2M12 18v3M9 21h6"/></svg>;}
export function CallIcon(){return <svg viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="6" width="12" height="12" rx="3"/><path d="m15 10 6-3v10l-6-3"/></svg>;}
