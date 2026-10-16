import {useEffect,useRef} from 'react';
export const CUELO_CHROME_STORE_URL='https://chromewebstore.google.com/detail/cuelo/hoafcdkncbacbngcdnamefjhelijkpbm';
export function chromeStoreLink(value:string|undefined){
 if(!value)return null;
 try{const url=new URL(value);return url.protocol==='https:'&&url.hostname==='chromewebstore.google.com'&&/^\/detail\/(?:[^/]+\/)?[a-p]{32}\/?$/.test(url.pathname)?url.href:null;}catch{return null;}
}
export function CallDownloads({onClose,listing=import.meta.env?.VITE_CUELO_CHROME_STORE_URL??CUELO_CHROME_STORE_URL}:{onClose:()=>void;listing?:string}){
 const panel=useRef<HTMLElement>(null),close=useRef<HTMLButtonElement>(null);
 const link=chromeStoreLink(listing);
 useEffect(()=>{close.current?.focus();const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();onClose();}if(e.key==='Tab'){const items=panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href]');if(!items?.length)return;const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key);},[onClose]);
 return <div className="call-download-backdrop" onClick={e=>{if(e.target===e.currentTarget)onClose();}}><section className="call-download-dialog" role="dialog" aria-modal="true" aria-labelledby="call-download-title" ref={panel}><button ref={close} className="download-close" onClick={onClose} aria-label="Close download options">Close</button><h2 id="call-download-title">Bring Cuelo to your call.</h2><p>Choose how you’d like to use Cuelo.</p><div className="download-options"><button disabled><strong>Cuelo for Windows</strong><span>Coming soon</span></button><button disabled><strong>Cuelo for Mac</strong><span>Coming soon</span></button>{link?<a href={link} target="_blank" rel="noreferrer"><strong>Get the Chrome extension</strong><span>Opens the Chrome Web Store</span></a>:<button disabled><strong>Get the Chrome extension</strong><span>Coming soon to the Chrome Web Store</span></button>}</div><p className="download-trial">Sign up with Google after installing. Get up to three free calls or 90 minutes of listening, whichever comes first.</p></section></div>;
}
