import {usePreviewCycle} from './usePreviewCycle';
import {CallIcon,MicIcon} from './Topbar';
const examples=[
 {question:'What is single sign-on?',answer:'Single sign-on lets you access multiple applications with one set of sign-in credentials.'},
 {question:'What is multi-factor authentication?',answer:'Multi-factor authentication asks for two or more checks, such as a password and a code, to help protect an account.'},
 {question:'How does encryption protect our data?',answer:'Encryption turns readable data into coded information. The correct key is needed to read it.'},
];
const exchangeTiming=[900,650,650,1000,2400] as const;
export function CallPreview(){
 const {root,phase,example:index,running}=usePreviewCycle(exchangeTiming,examples.length);
 const example=examples[index];
 return <section ref={root} className={`call-preview ${running?'in-view':''}`} aria-label="Illustrative on-call animation" data-phase={phase} data-example={index} data-playing={running}>
 <div className="preview-heading"><div><h2>A question comes up.<br/>Your conversation carries on.</h2></div></div>
 <div className="preview-desktop">
 <div className="preview-window-bar"><div className="window-controls" aria-hidden="true"><span/><span/><span/></div><span>Cuelo · call preview</span><CallIcon/></div>
 <div className="preview-meeting"><div className="meeting-topline"><span>Example customer call</span></div>
 <div className="participant-grid"><div className="participant customer"><div className="participant-avatar" aria-hidden="true">C</div><div className="participant-caption"><span>Customer</span><div className="audio-bars" aria-hidden="true">{[0,1,2,3,4].map(i=><i key={i} style={{animationDelay:`${i*.12}s`}}/>)}</div></div></div><div className="participant salesperson"><div className="participant-avatar" aria-hidden="true">Y</div><div className="participant-caption"><span>You</span><MicIcon/></div></div></div>
 <div className="preview-listening" data-stage={phase}><span className="preview-small-blob" aria-hidden="true"><i/><i/></span><span>{phase===0?'Cuelo is listening':phase===1?'Question identified':phase===2?'Question ready':'Answer ready'}</span><span className="listening-wave" aria-hidden="true">{[0,1,2,3,4].map(i=><i key={i}/>)}</span></div>
 <div key={index} className={`preview-question ${phase>=2?'is-identified':'is-waiting'}`}><span>Customer question</span><p>“{example.question}”</p></div>
 <div className="meeting-controls" aria-hidden="true"><span><MicIcon/></span><span><CallIcon/></span><span className="leave-call"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 13c4-5 12-5 16 0M4 13v4m16-4v4"/></svg></span></div>
 </div>
 <aside className={`preview-answer ${phase>=3?'shown':''}`} aria-label="Illustrative Cuelo answer"><div className="preview-answer-top"><span className="preview-small-blob" aria-hidden="true"><i/><i/></span><strong>Cuelo</strong><span>Example</span></div><ul><li>{example.answer}</li></ul></aside>
 </div>
 <div className="preview-story" aria-label="Animation progress"><span className={phase===0?'current':''}>Listening</span><span className={phase===1||phase===2?'current':''}>Question identified</span><span className={phase>=3?'current':''}>You see text</span></div>
 </section>;
}
