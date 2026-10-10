// Auto-appearing panel, not an always-on-top system window.
const host=document.createElement('div');host.style.cssText='position:fixed;right:20px;top:80px;z-index:2147483647';const root=host.attachShadow({mode:'closed'});
root.innerHTML='<section style="width:290px;background:white;color:#111;padding:16px;border:1px solid #777;border-radius:12px;font:14px system-ui"><strong>Cuelo feasibility · no AI</strong><p>Joined-call controls detected. Experimental English Meet check.</p><button id="prepare">Test Prepare-only capture</button><button id="stop">Stop probe</button><button id="float">Test floating window</button><p id="status" role="status">No capture</p><meter id="meter" min="0" max="1" value="0"></meter></section>';
const status=root.getElementById('status'),meter=root.getElementById('meter');
let actionError='';
async function request(type){
 if(type!=='status')actionError='';
 try{const r=await chrome.runtime.sendMessage({type});if(type!=='status'&&r.error)actionError=r.error;status.textContent=actionError||r.error||r.status;meter.value=r.peak??0;}
 catch{if(type!=='status')actionError='Extension connection unavailable';status.textContent=actionError||'Extension connection unavailable';}
}
root.getElementById('prepare').onclick=()=>request('prepare');root.getElementById('stop').onclick=()=>request('stop');
root.getElementById('float').onclick=async()=>{try{const w=await documentPictureInPicture.requestWindow({width:340,height:240});w.document.body.textContent='Local floating-window probe; no generated answers.';}catch{status.textContent='Floating window unavailable from this page.';}};
let leftReported=false;
function checkMeeting(){
 const state=globalThis.cueloProbeMeetingState(document,location.pathname);
 if(state==='joined'){
  if(!host.isConnected)document.documentElement.append(host);
  leftReported=false;void request('status');
 }else{
  host.remove();
  if(state==='left'&&!leftReported){leftReported=true;void request('left');}
  if(state!=='left')leftReported=false;
 }
}
checkMeeting();setInterval(checkMeeting,500);
