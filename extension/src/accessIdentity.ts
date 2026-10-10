// Diagnostic only. The server's authenticated access query still decides access.
// Never return, log or display the credential or session identifier.
export function accessIdentity(token:string|null,backend:string,now=Date.now()):string|null {
 if(!token||token.length>20000)return null;
 try{const parts=token.split('.');if(parts.length!==3)return null;const payload=JSON.parse(atob(parts[1].replace(/-/g,'+').replace(/_/g,'/')));
 if(payload.iss!==backend.replace('.convex.cloud','.convex.site')||typeof payload.exp!=='number'||payload.exp*1000<=now||typeof payload.sub!=='string')return null;
 const subject=payload.sub.split('|');if(subject.length!==2||!subject[1]||! /^[a-z0-9]{16,64}$/.test(subject[0]))return null;return subject[0];
 }catch{return null;}
}
