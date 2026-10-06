import {useEffect,useRef,useState} from 'react';
import {CallIcon,MicIcon} from './Topbar';
export function CallPreview(){
 const root=useRef<HTMLElement|null>(null);
 const [visible,setVisible]=useState(false),[phase,setPhase]=useState(0),[playing,setPlaying]=useState(true),[reduced,setReduced]=useState(false);
 useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)');const update=()=>{setReduced(media.matches);if(media.matches){setPhase(2);setPlaying(false);}};update();media.addEventListener('change',update);const observer=new IntersectionObserver(entries=>setVisible(entries.some(e=>e.isIntersecting)),{threshold:.25});if(root.current)observer.observe(root.current);return()=>{media.removeEventListener('change',update);observer.disconnect();};},[]);
 useEffect(()=>{if(!visible||!playing||reduced)return;const timer=setTimeout(()=>{if(phase<2)setPhase(phase+1);else setPlaying(false);},phase===0?1800:phase===1?1400:1200);return()=>clearTimeout(timer);},[visible,playing,reduced,phase]);
 function toggle(){if(phase===2){setPhase(0);setPlaying(true);}else setPlaying(!playing);}
 return <section ref={root} className={`call-preview ${visible?'in-view':''}`} aria-label="Illustrative on-call animation" data-phase={phase} data-playing={playing&&visible&&!reduced}>
 <div className="preview-heading"><div><h2>A question comes up.<br/>Your conversation carries on.</h2><p>Illustrative animation. No call is connected or audio captured.</p></div><button className="preview-toggle" type="button" onClick={toggle} disabled={reduced}>{reduced?'Motion reduced':playing?'Pause animation':phase===2?'Replay animation':'Play animation'}</button></div>
 <div className="preview-desktop">
 <div className="preview-window-bar"><div className="window-controls" aria-hidden="true"><span/><span/><span/></div><span>Cuelo · call preview</span><CallIcon/></div>
 <div className="preview-meeting"><div className="meeting-topline"><span>Example customer call</span><span className="preview-mode">Animation only</span></div>
 <div className="participant-grid"><div className="participant customer"><div className="participant-avatar" aria-hidden="true">C</div><div className="participant-caption"><span>Customer</span><div className="audio-bars" aria-hidden="true">{[0,1,2,3,4].map(i=><i key={i} style={{animationDelay:`${i*.12}s`}}/>)}</div></div></div><div className="participant salesperson"><div className="participant-avatar" aria-hidden="true">Y</div><div className="participant-caption"><span>You</span><MicIcon/></div></div></div>
 <div className="preview-question"><span>Customer question</span><p>“What is single sign-on?”</p></div>
 <div className="meeting-controls" aria-hidden="true"><span><MicIcon/></span><span><CallIcon/></span><span className="leave-call"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 13c4-5 12-5 16 0M4 13v4m16-4v4"/></svg></span></div>
 </div>
 <aside className={`preview-answer ${phase>0?'shown':''}`} aria-label="Illustrative Cuelo answer"><div className="preview-answer-top"><span className="preview-small-blob" aria-hidden="true"><i/><i/></span><strong>Cuelo</strong><span>Example</span></div>{phase===1?<div className="preview-processing"><span className="processing-dots" aria-hidden="true"><i/><i/><i/></span><p>Finding the answer…</p></div>:<><p className="preview-provenance">Not from your document</p><ul><li>Single sign-on lets you access multiple applications with one set of login credentials.</li></ul><p className="preview-answer-note">Prewritten example · general knowledge</p></>}</aside>
 </div>
 <div className="preview-story" aria-label="Animation progress"><span className={phase===0?'current':''}>Customer asks</span><span className={phase===1?'current':''}>Cuelo checks</span><span className={phase===2?'current':''}>You see text</span></div>
 </section>;
}
