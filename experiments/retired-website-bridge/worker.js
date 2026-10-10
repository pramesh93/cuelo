// Cuelo website owns authentication, backend admission and provider connections.
const ORIGINS=new Set(['http://127.0.0.1:5173','https://calculating-gecko-263.convex.site','https://deafening-frog-846.convex.site']);
let website=null,view=null,connecting=false,capturing=false,revision=0,runId=null,bridgeTab=null,sequence=0,pendingTab=null;
const audioURL=chrome.runtime.getURL('audio.html');
async function joined(id){if(!Number.isInteger(id))return false;try{const tab=await chrome.tabs.get(id);if(!tab.url?.startsWith('https://meet.google.com/'))return false;return (await chrome.tabs.sendMessage(id,{type:'call-state'}))?.joined===true;}catch{return false;}}
function post(message){if(!website)throw Error('Open Cuelo and sign in before starting.');website.postMessage(message);}
async function stopCapture(message='Stopped. Audio is off.',notify=false){revision++;capturing=false;connecting=false;pendingTab=null;runId=null;await chrome.runtime.sendMessage({to:'audio',type:'stop'}).catch(()=>{});if(view)view={...view,state:'idle',busy:false,result:null,message};if(notify&&website)try{post({type:'meeting-ended',message});}catch{}}
async function selectedMeeting(){const saved=await chrome.storage.session.get(['meetingTabId','panelWindowId']);const tabs=await chrome.tabs.query({active:true,...(Number.isInteger(saved.panelWindowId)?{windowId:saved.panelWindowId}:{lastFocusedWindow:true})});return {id:saved.meetingTabId,visible:tabs[0],joined:await joined(tabs[0]?.id)};}
async function ensureWebsite(){if(website){if(Number.isInteger(bridgeTab))await chrome.tabs.update(bridgeTab,{active:true});return;}const saved=await chrome.storage.local.get('websiteOrigin');const origin=ORIGINS.has(saved.websiteOrigin)?saved.websiteOrigin:'http://127.0.0.1:5173';const url=`${origin}/?view=extension&extensionId=${chrome.runtime.id}`;if(Number.isInteger(bridgeTab)){try{const existing=await chrome.tabs.get(bridgeTab);await chrome.tabs.update(bridgeTab,{active:true,...(existing.url===url?{}:{url})});return;}catch{}}const tab=await chrome.tabs.create({url});bridgeTab=tab.id;}
chrome.action.onClicked.addListener(tab=>{if(!tab.id)return;void chrome.sidePanel.open({tabId:tab.id}).catch(()=>{});void(async()=>{if(!capturing&&!connecting&&view?.state!=='paused')await chrome.storage.session.set({meetingTabId:tab.url?.startsWith('https://meet.google.com/')?tab.id:null,panelWindowId:tab.windowId});if(!website&&await joined(tab.id))await ensureWebsite();})().catch(()=>{});});
chrome.tabs.onRemoved.addListener(id=>{void chrome.storage.session.get('meetingTabId').then(saved=>{if(saved.meetingTabId===id)return stopCapture('Meet tab closed. Cuelo stopped.',true);}).catch(()=>{});if(id===bridgeTab)bridgeTab=null;});
chrome.runtime.onConnectExternal.addListener(port=>{
 let url;try{url=new URL(port.sender?.url);}catch{port.disconnect();return;}
 if(port.name!=='cuelo-live-v1'||!ORIGINS.has(url.origin)||url.pathname!=='/'||url.searchParams.get('view')!=='extension'||url.searchParams.get('extensionId')!==chrome.runtime.id||!Number.isInteger(port.sender?.tab?.id)){port.disconnect();return;}
 if(website){port.disconnect();return;}website=port;bridgeTab=port.sender.tab.id;view=null;
 port.onMessage.addListener(m=>{void(async()=>{
  if(port!==website||!m||typeof m!=='object')return;
  if(m.type==='snapshot'){if(!m.view||!['idle','connecting','listening','paused'].includes(m.view.state))return;view=m.view;if(view.state!=='connecting')connecting=false;if(!view.signedIn&&(capturing||connecting))await stopCapture('You signed out. Cuelo stopped.',true);return;}
  if(m.type==='ack'){if(capturing&&m.runId===runId&&Number.isInteger(m.sequence)&&m.sequence<=sequence)await chrome.runtime.sendMessage({to:'audio',type:'ack',runId,sequence:m.sequence});return;}
  if(m.type==='capture-stop'){await stopCapture(m.message);port.postMessage({type:'reply',requestId:m.requestId,ok:true});return;}
  if(m.type!=='capture-start')return;
  const run=revision;
  try{
   if(!connecting||!view?.signedIn||!view.invited||!view.enabled)throw Error('Start through the Cuelo sidebar after signing in.');
   if(!Number.isFinite(m.deadline)||m.deadline<=Date.now()||m.deadline>Date.now()+3600000)throw Error('This session expired.');
   const target={id:pendingTab};if(!Number.isInteger(target.id)||!await joined(target.id))throw Error('The selected Meet call ended before audio could start.');
   const streamId=await chrome.tabCapture.getMediaStreamId({targetTabId:target.id});
   if(run!==revision||!await joined(target.id))throw Error('Meeting ended during startup.');
   const contexts=await chrome.runtime.getContexts({contextTypes:['OFFSCREEN_DOCUMENT'],documentUrls:[audioURL]});if(!contexts.length)await chrome.offscreen.createDocument({url:'audio.html',reasons:['USER_MEDIA'],justification:'Forward live Meet audio to your signed-in Cuelo session; no recording.'});
   if(run!==revision||!await joined(target.id))throw Error('Meeting ended during startup.');
   runId=crypto.randomUUID();sequence=0;capturing=true;const response=await chrome.runtime.sendMessage({to:'audio',type:'start',streamId,runId,deadline:m.deadline});
   if(run!==revision||!response?.ok||!await joined(target.id))throw Error('Meeting audio did not start or the meeting ended.');
   port.postMessage({type:'reply',requestId:m.requestId,ok:true});
  }catch(error){if(run===revision)await stopCapture(error.message);if(run===revision-1&&/not been invoked|activeTab|permission/i.test(error.message))await chrome.storage.session.set({meetingTabId:null});port.postMessage({type:'reply',requestId:m.requestId,ok:false,message:error.message});}
 })().catch(()=>{void stopCapture('Cuelo disconnected.',true);});});
 port.onDisconnect.addListener(()=>{if(port!==website)return;website=null;view=null;void stopCapture('Cuelo page disconnected. Audio stopped.');});
 port.postMessage({type:'connected'});
});
chrome.runtime.onMessage.addListener((m,sender,reply)=>{
 if(m.to==='audio')return;
 (async()=>{
  if(sender.url===audioURL){if(m.type==='pcm'){if(!capturing||m.runId!==runId)return {};if(typeof m.frame!=='string'||m.frame.length!==2136||m.sequence!==sequence+1)throw Error('Meeting audio became unreadable.');sequence=m.sequence;post({type:'frame',runId,sequence,frame:m.frame});return {};}
   if(m.type==='audio-ended'&&m.runId===runId){await stopCapture(m.message,true);return {};}return {};}
  const saved=await chrome.storage.session.get('meetingTabId');
  if(m.type==='left'){if(sender.tab?.id!==saved.meetingTabId)throw Error('Another meeting ended.');await stopCapture('Meeting ended. Cuelo stopped.',true);return {};}
  if(sender.url!==chrome.runtime.getURL('sidepanel.html'))throw Error('Open the Cuelo sidebar.');
  if(m.type==='connect'){await ensureWebsite();return {};}
  if(m.type==='configure'){if(capturing||connecting||view?.state==='paused')throw Error('Stop before changing the connection.');if(!ORIGINS.has(m.origin))throw Error('Choose an existing Cuelo address.');await chrome.storage.local.set({websiteOrigin:m.origin});if(website){const previous=website;website=null;view=null;previous.disconnect();}await ensureWebsite();return {};}
  if(m.type==='status'){
   if((capturing||connecting||view?.state==='paused')&&!await joined(saved.meetingTabId))await stopCapture('Meeting ended or disconnected. Cuelo stopped.',true);
   const target=await selectedMeeting(),active=capturing||connecting||view?.state==='paused';
   const authorised=target.joined&&target.visible?.id===target.id;
   return {view,connected:!!website,connecting,capturing,meetingJoined:active?await joined(saved.meetingTabId):target.joined,authorised:active||authorised,message:active?view?.message:!target.joined?'Start or join a Google Meet call to use Cuelo.':!authorised?'Meeting detected. Click Cuelo’s toolbar icon on this Meet tab to enable setup and audio access.':!website?'Connect Cuelo to sign in and load your saved source.':view?.message??'Checking your account…'};
  }
  if(m.type==='stop'){await stopCapture();post({type:'command',action:'stop'});return {};}
  if(m.type==='pause'){await stopCapture('Paused. Audio is off.');if(view)view={...view,state:'paused'};post({type:'command',action:'pause'});return {};}
  if(m.type!=='start'&&m.type!=='resume')throw Error('Unknown sidebar action.');
  if(connecting||capturing||view?.controlsBusy)throw Error('Cuelo is still finishing the previous action. Wait a moment.');
  if(!view?.signedIn||!view.invited||!view.enabled)throw Error('Sign in with invited testing access before starting.');
  const target=await selectedMeeting();if(!target.joined||target.visible?.id!==target.id)throw Error('Click Cuelo’s toolbar icon on your joined Meet tab first.');
  if(m.type==='start'&&(!['generic','document'].includes(m.mode)||m.mode==='document'&&m.sourceId!==view.source?.id))throw Error('Choose your answer mode and current saved source.');
  pendingTab=target.id;connecting=true;post({type:'command',action:m.type,mode:m.mode,sourceId:m.sourceId});return {};
 })().then(reply).catch(error=>{if(sender.url===audioURL)void stopCapture('Meeting audio disconnected.',true);reply({error:error.message});});return true;
});
