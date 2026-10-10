const status=document.getElementById('status'),meter=document.getElementById('meter');
let actionError='';
async function request(type){
 if(type!=='status')actionError='';
 try{const r=await chrome.runtime.sendMessage({type});if(type!=='status'&&r.error)actionError=r.error;status.textContent=actionError||r.error||r.status;meter.value=r.peak??0;}
 catch{if(type!=='status')actionError='Extension connection unavailable';status.textContent=actionError||'Extension connection unavailable';}
}
document.getElementById('prepare').onclick=()=>request('prepare');document.getElementById('stop').onclick=()=>request('stop');setInterval(()=>request('status'),500);
