// Isolated local feasibility probe. No provider, backend, persistence or recordings.
let target=null, status='Idle; no capture', peak=0;
async function stop(){await chrome.runtime.sendMessage({to:'audio',type:'stop'}).catch(()=>{});target=null;status='Stopped; no capture';peak=0;}
chrome.tabs.onRemoved.addListener(id=>{if(id===target)void stop();});
chrome.runtime.onMessage.addListener((message,sender,reply)=>{
 if(message.to==='audio')return;
 (async()=>{
  if(message.type==='level'){if(sender.url!==chrome.runtime.getURL('audio.html'))throw Error('Unexpected sender');peak=message.peak;return {};}
  if(message.type==='ended'){if(sender.url!==chrome.runtime.getURL('audio.html'))throw Error('Unexpected sender');target=null;status='Stopped by local 60-second cutoff';peak=0;return {};}
  const tab=sender.tab??(await chrome.tabs.query({active:true,currentWindow:true}))[0];
  if(message.type==='status')return {status,peak};
  if(!tab?.id||!tab.url?.startsWith('https://meet.google.com/'))throw Error('Open a Google Meet tab first.');
  if(message.type==='stop'||message.type==='left'){if(target===tab.id)await stop();return {status,peak};}
  if(message.type!=='prepare')throw Error('Unknown probe action');
  if(target!==null)throw Error('Stop the previous probe first.');
  // Deliberately try the same API for panel-only and toolbar-popup activation.
  // Chrome, not this code, decides whether invocation permission is present.
  const streamId=await chrome.tabCapture.getMediaStreamId({targetTabId:tab.id});
  const contexts=await chrome.runtime.getContexts({contextTypes:['OFFSCREEN_DOCUMENT'],documentUrls:[chrome.runtime.getURL('audio.html')]});
  if(!contexts.length)await chrome.offscreen.createDocument({url:'audio.html',reasons:['USER_MEDIA'],justification:'Local ephemeral tab-audio meter; no recording or network.'});
  target=tab.id;
  const started=await chrome.runtime.sendMessage({to:'audio',type:'start',streamId});
  if(!started?.ok){await stop();throw Error('Local audio capture could not start.');}
  status='Tab capture started; check meter while participant speaks';return {status,peak};
 })().then(reply).catch(error=>reply({error:error.message}));return true;
});
