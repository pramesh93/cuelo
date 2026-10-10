// Unpaid isolated side-panel probe. No provider, backend, recording or transcript.
const SOURCE_IDS=['sign-in','onboarding'];let starting=false,peak=0,startRevision=0;
const defaults={active:false,status:'Choose a source, then Start.',peak:0,sourceId:null};
async function state(){return {...defaults,...(await chrome.storage.session.get('probe')).probe,peak};}
async function joinedCall(tabId){
 if(!Number.isInteger(tabId))return false;
 try{const tab=await chrome.tabs.get(tabId);if(!tab.url?.startsWith('https://meet.google.com/'))return false;const result=await chrome.tabs.sendMessage(tabId,{type:'call-state'});return result?.joined===true;}catch{return false;}
}
async function patch(values){await chrome.storage.session.set({probe:{...await state(),...values}});}
async function stop(status='Stopped; no capture'){startRevision++;peak=0;await chrome.runtime.sendMessage({to:'audio',type:'stop'}).catch(()=>{});await patch({active:false,status,peak:0});}
chrome.action.onClicked.addListener(tab=>{
 if(!tab.id)return;
 // Open synchronously from Chrome's toolbar action; this action also grants activeTab.
 void chrome.sidePanel.open({tabId:tab.id}).catch(()=>{});
 void chrome.storage.session.get('probe').then(saved=>{if(!saved.probe?.active&&!starting)return chrome.storage.session.set({meetingTabId:tab.url?.startsWith('https://meet.google.com/')?tab.id:null,panelWindowId:tab.windowId??null});});
});
chrome.tabs.onRemoved.addListener(id=>{void chrome.storage.session.get('meetingTabId').then(saved=>{if(saved.meetingTabId===id)return stop('Meet tab closed; no capture');}).catch(()=>{});});
chrome.runtime.onMessage.addListener((m,sender,reply)=>{
 if(m.to==='audio')return;
 (async()=>{
  if(m.type==='level'||m.type==='ended'){
   if(sender.url!==chrome.runtime.getURL('audio.html'))throw Error('Unexpected audio sender.');
   if(m.type==='level'){const current=await state();if(current.active&&typeof m.peak==='number'&&Number.isFinite(m.peak))peak=Math.max(0,Math.min(1,m.peak));}
   else {peak=0;await patch({active:false,status:'The 60-second unpaid test ended; no capture'});}
   return {};
  }
  const {meetingTabId}=await chrome.storage.session.get('meetingTabId');
  if(m.type==='left'){
   if(sender.tab?.id!==meetingTabId)throw Error('Departure is from another tab.');
   await stop('Meeting ended; no capture');return await state();
  }
  if(sender.url!==chrome.runtime.getURL('sidepanel.html'))throw Error('Open the Cuelo side panel.');
  if(m.type==='status'){
   const current=await state();
   if(current.active)return {...current,meetingSelected:true,meetingJoined:await joinedCall(meetingTabId)};
   const {panelWindowId}=await chrome.storage.session.get('panelWindowId');
   const tabs=await chrome.tabs.query({active:true,...(Number.isInteger(panelWindowId)?{windowId:panelWindowId}:{lastFocusedWindow:true})});
   const visible=tabs[0],meetingJoined=await joinedCall(visible?.id);
   const meetingSelected=meetingJoined&&visible.id===meetingTabId;
   const prefix=current.status.includes('no capture')?current.status+' · ':'';
   const status=!meetingJoined?prefix+'Start or join a Google Meet call to use Cuelo.':!meetingSelected?'Meeting detected. Click Cuelo’s toolbar icon on this Meet tab to enable setup and audio access.':current.status==='Choose a source, then Start.'||current.status.includes('no capture')?prefix+'Choose a source, then Start.':current.status;
   return {...current,meetingSelected,meetingJoined,status};
  }
  if(m.type==='stop'){await stop();return await state();}
  if(m.type!=='start')throw Error('Unknown probe action.');
  if(!SOURCE_IDS.includes(m.sourceId))throw Error('Choose one of the example sources first.');
  if(starting||(await state()).active)throw Error('Audio is already starting or active.');
  if(!Number.isInteger(meetingTabId))throw Error('Click the Cuelo toolbar icon on your Meet tab first.');
  const {panelWindowId}=await chrome.storage.session.get('panelWindowId');
  const visible=await chrome.tabs.query({active:true,...(Number.isInteger(panelWindowId)?{windowId:panelWindowId}:{lastFocusedWindow:true})});
  if(visible[0]?.id!==meetingTabId)throw Error('Return to your Meet tab, or click Cuelo’s toolbar icon on the new Meet tab for audio access.');
  const tab=await chrome.tabs.get(meetingTabId);
  if(!tab.url?.startsWith('https://meet.google.com/')||!await joinedCall(meetingTabId))throw Error('Start or join a Google Meet call to use Cuelo.');
  starting=true;const revision=startRevision;
  const checkStartup=async()=>{if(revision!==startRevision||!await joinedCall(meetingTabId))throw Error('Meeting ended or startup cancelled; no capture.');};
  try{
   const streamId=await chrome.tabCapture.getMediaStreamId({targetTabId:meetingTabId});
   await checkStartup();
   const contexts=await chrome.runtime.getContexts({contextTypes:['OFFSCREEN_DOCUMENT'],documentUrls:[chrome.runtime.getURL('audio.html')]});
   if(!contexts.length)await chrome.offscreen.createDocument({url:'audio.html',reasons:['USER_MEDIA'],justification:'Ephemeral local Meet audio meter; no recording or provider requests.'});
   await checkStartup();
   const result=await chrome.runtime.sendMessage({to:'audio',type:'start',streamId});
   await checkStartup();
   if(!result?.ok)throw Error('Tab audio could not start.');
   await patch({active:true,status:'Capturing Meet audio · no transcription or AI',sourceId:m.sourceId,peak:0});return await state();
  }catch(error){await stop('Audio did not start; no capture');if(/not been invoked|activeTab|permission/i.test(error.message))await chrome.storage.session.set({meetingTabId:null});throw error;}finally{starting=false;}
 })().then(reply).catch(error=>reply({error:error.message}));return true;
});
