import {useRef,useState} from 'react';
import {OpeningDemo} from './OpeningDemo';
import {FeaturePreview} from './FeaturePreviews';
import {CallPreview} from './CallPreview';
import {CallDownloads} from './CallDownloads';
import {Topbar,CallIcon} from './Topbar';
export function Home(){
 const [downloads,setDownloads]=useState(false),downloadTrigger=useRef<HTMLButtonElement|null>(null);
 return <><Topbar home/><main className="home-page">
 <section className="opening" aria-labelledby="opening-heading"><h1 id="opening-heading">Your quiet assistant<br className="desktop-break"/> for live calls.</h1><p className="home-intro">Less digging through documents. More confidence answering questions on every call.</p>
 <OpeningDemo/></section>
 <section className="call-invitation-section" aria-label="Try Cuelo on a call"><CallPreview/><button className="call-invitation" type="button" ref={downloadTrigger} onClick={()=>setDownloads(true)}><CallIcon/><span>Experience Cuelo on a call</span><span className="invitation-arrow" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></span></button></section>{downloads&&<CallDownloads onClose={()=>{setDownloads(false);downloadTrigger.current?.focus();}}/>}
 <section id="features" className="landing-info"><h2>Stay with the conversation.</h2><div className="landing-feature-list"><article><FeaturePreview kind="answers"/><h3>Answers beside your call</h3><p>Cuelo shows short answers in the Chrome sidebar while you stay in Google Meet.</p></article><article><FeaturePreview kind="sources"/><h3>Your document, within reach</h3><p>Add a document, pasted text or public webpage. Open the supporting passage when you need to check an answer.</p></article><article><FeaturePreview kind="controls"/><h3>You control the listening</h3><p>Start when you’re ready. Pause or stop at any time. Cuelo responds in text.</p></article></div></section>
 <section id="about" className="landing-info"><h2>About Cuelo</h2><p>Cuelo helps salespeople find answers while staying present in a conversation. It brings general knowledge or a selected product document beside the call.</p></section>
 <section id="pricing" className="landing-info"><h2>Pricing</h2><p>Sign up for up to three free calls or 90 minutes, including paused time, whichever comes first. Paid plans are coming soon.</p><a href="/?view=account&intent=signup">Create your Cuelo account</a></section>
 </main></>;
}
