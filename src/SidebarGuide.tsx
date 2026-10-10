import {Topbar} from './Topbar';
export function SidebarInstructions(){
 return <section aria-label="Use Cuelo beside Google Meet">
 <h2>Use Cuelo in the Chrome sidebar.</h2>
 <ol><li>Join your Google Meet call in desktop Chrome.</li><li>Open the Cuelo extension to show its sidebar.</li><li>Choose Generic answers or Answers from my document. Select or add one source for document answers.</li><li>Click Start in the sidebar. Your answers and Pause/Stop controls stay there.</li></ol>
 <p>With the Cuelo extension installed, signing in on this website also signs you into its sidebar, and signing in there signs you into this website. Use the same Chrome profile. After installing or reloading the extension, refresh the website.</p>
 <p className="supporting">Live calls are available to invited testers. Cuelo never speaks. Sharing the window containing Cuelo may show its answers.</p>
 <p className="supporting">Extension installation instructions will be provided with the invited-test release.</p>
 </section>;
}
export function SidebarGuide(){return <><Topbar/><main className="account-page"><h1>Add Cuelo to your call.</h1><SidebarInstructions/><p><a href="/?view=account">Manage your account</a> · <a href="/?view=sources">Manage your source</a></p><p role="status">Audio is off. Start listening from the Cuelo sidebar.</p></main></>;}
