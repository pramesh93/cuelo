// No tabCapture, sharing picker, auth, backend or paid providers.
const get=async()=> (await chrome.storage.session.get(['probeWindow','probeTab']));
const send=(id,type)=>chrome.tabs.sendMessage(id,{to:'meet-audio-check',type});
const meet=tab=>/^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}(?:[/?#]|$)/.test(tab?.url??'');
chrome.action.onClicked.addListener(tab=>{void chrome.storage.session.set({probeWindow:tab.windowId}).catch(()=>{});void chrome.sidePanel.open({windowId:tab.windowId}).catch(()=>{});});
async function target(){const stored=await get();if(stored.probeTab){const current=await send(stored.probeTab,'status').catch(()=>null);if(current&&current.state!=='idle')return {tabId:stored.probeTab,status:current};await chrome.storage.session.remove('probeTab');}
 const [tab]=await chrome.tabs.query({active:true,windowId:stored.probeWindow??chrome.windows.WINDOW_ID_CURRENT});if(!meet(tab))return {tabId:null,status:{state:'idle',joined:false,message:'Join a Meet call to use this check.'}};
 const status=await send(tab.id,'status').catch(()=>({state:'idle',joined:false,message:'Reload this Meet tab after loading the check extension.'}));return {tabId:tab.id,status};
}
chrome.runtime.onMessage.addListener((message,sender,reply)=>{
 if(sender.id!==chrome.runtime.id||sender.url!==chrome.runtime.getURL('sidepanel.html'))return;
 if(!['status','start','pause','stop'].includes(message?.type))return;
 void(async()=>{const current=await target();if(message.type==='status')return current.status;if(!current.tabId||!current.status.joined){if(message.type==='stop'){await chrome.storage.session.remove('probeTab');return current.status;}throw Error('Join a Meet call first.');}
 if(message.type==='start'){await chrome.storage.session.set({probeTab:current.tabId});const result=await send(current.tabId,'start');if(result.error)await chrome.storage.session.remove('probeTab');return result;}
 const result=await send(current.tabId,message.type);if(message.type==='stop')await chrome.storage.session.remove('probeTab');return result;
 })().then(reply).catch(()=>reply({error:'The audio check could not connect. Reload the Meet tab and try again.'}));return true;
});
chrome.tabs.onRemoved.addListener(id=>{void get().then(stored=>stored.probeTab===id?chrome.storage.session.remove('probeTab'):undefined).catch(()=>{});});
