import {useState} from 'react';
import {useAction,useQuery} from 'convex/react';
import {api} from '../convex/_generated/api';
import {SourceManager,getSourceVisitSecret} from './SourceManager';
import {Topbar,CallIcon} from './Topbar';
export function PracticeSetup(){
 const [guestSecret]=useState(getSourceVisitSecret),[own,setOwn]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const source=useQuery(api.sources.get,{guestSecret});const webpage=useAction(api.sourceImport.webpage);
 async function sample(){setBusy(true);setMessage('');try{await webpage({guestSecret,expectedId:source?.id??null,url:'https://slack.com/help/articles/203772216-SAML-single-sign-on'});setOwn(true);}catch{setMessage('The sample couldn’t load. Try again or add your own source.');}finally{setBusy(false);}}
 return <><Topbar/><main className="account-page practice-page"><div className="page-symbol"><CallIcon/></div><h1>Practice call</h1><p className="intro">Try with a sample, or add your own product document.</p><div className="practice-choices"><button className="cancel-button" disabled={busy||source===undefined} onClick={sample}>{busy?'Reading the sample…':source?'Use the Slack sample instead':'Try with a sample'}</button><button className="cancel-button" onClick={()=>setOwn(true)}>Upload my document</button></div><p className="supporting">The sample uses Slack’s public SAML single sign-on article. Choosing it replaces the current temporary source.</p>{own&&<SourceManager onConfirmed={()=>setMessage('Your source is selected. The speaking practice call is not available yet.')}/>}{message&&<p role="status">{message}</p>}<div className="practice-readiness"><h2>A customer call, without the pressure.</h2><p>The practice call will ask three questions supported by your source. The speaking customer and live audio answers aren’t connected yet.</p><p className="supporting">Microphone off. Nothing is being recorded.</p><button className="primary" disabled>Join practice call</button></div><footer>Guest sources are temporary. You can replace or delete your source above.</footer></main></>;
}
