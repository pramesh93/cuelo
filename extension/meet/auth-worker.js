import {checkAuthStart,authReturn} from './auth-policy.js';
import {authConfig} from './auth-config.js';
import './call-worker.js';
let pending=null;
void chrome.storage.local.setAccessLevel({accessLevel:'TRUSTED_CONTEXTS'}).catch(()=>{});
chrome.action.onClicked.addListener(tab=>{if(tab.id)void chrome.sidePanel.open({windowId:tab.windowId}).catch(()=>{});});
chrome.runtime.onConnect.addListener(port=>{
 if(port.name!=='cuelo-signin'||port.sender?.url!==chrome.runtime.getURL('auth-check.html')){port.disconnect();return;}
 const settle=async(message)=>{if(pending?.port!==port)return;const current=pending;pending=null;clearTimeout(current.timer);if(Number.isInteger(current.windowId))await chrome.windows.remove(current.windowId).catch(()=>{});try{port.postMessage(message);}catch{}};
 port.onMessage.addListener(message=>{
  if(message?.type==='ping')return;
  if(message?.type!=='signin'||pending){port.postMessage({error:'Google sign-in is already open. Finish it or close the window.'});return;}
  void(async()=>{
   try{
    if(typeof message.nonce!=='string'||! /^[a-f0-9]{64}$/.test(message.nonce))throw Error('Invalid sign-in request.');
    const url=checkAuthStart(message.redirect,authConfig.siteOrigin);
    const request={port,nonce:message.nonce,windowId:null,timer:setTimeout(()=>{void settle({error:'Google sign-in timed out. Try again.'});},180000)};pending=request;
    // Explicit popup type, never a normal tab or a persistent Cuelo page.
    const popup=await chrome.windows.create({url,type:'popup',width:500,height:700,focused:true});
    if(pending!==request){if(Number.isInteger(popup.id))await chrome.windows.remove(popup.id).catch(()=>{});return;}if(!Number.isInteger(popup.id))throw Error('Sign-in window did not open.');request.windowId=popup.id;const tabs=await chrome.tabs.query({windowId:popup.id});for(const tab of tabs)inspectReturn(tab.url,tab.windowId);
   }catch{if(pending?.port===port)await settle({error:'Google sign-in could not open. Try again.'});else try{port.postMessage({error:'Google sign-in could not open safely. Try again.'});}catch{}}
  })();
 });
 port.onDisconnect.addListener(()=>{if(pending?.port===port)void settle({error:'Sign-in cancelled because the sidebar closed.'});});
});
function inspectReturn(url,windowId){
 const current=pending;if(!current||windowId!==current.windowId||!url)return;
 try{const code=authReturn(url,authConfig.returnOrigin,current.nonce);if(!code)return;pending=null;clearTimeout(current.timer);void chrome.windows.remove(current.windowId).catch(()=>{}).finally(()=>{try{current.port.postMessage({code});}catch{}});}catch{const port=current.port;pending=null;clearTimeout(current.timer);void chrome.windows.remove(current.windowId).catch(()=>{}).finally(()=>{try{port.postMessage({error:'Google sign-in could not be verified. Try again.'});}catch{}});}
}
chrome.tabs.onUpdated.addListener((_id,change,tab)=>inspectReturn(change.url,tab.windowId));
chrome.windows.onRemoved.addListener(id=>{const current=pending;if(current?.windowId!==id)return;pending=null;clearTimeout(current.timer);try{current.port.postMessage({error:'Google sign-in was cancelled. You can try again.'});}catch{}});
