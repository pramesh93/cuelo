type Store=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
const handoffKey='cuelo-temporary-source-handoff';
const legacyKey='cuelo-temporary-source';
export function createTemporarySourceVisit({storage,href,referrer,navigation,random,now=Date.now}:{storage:Store;href:string;referrer:string;navigation:string;random:()=>string;now?:()=>number}){
 let secret=random();
 try{
  const raw=storage.getItem(handoffKey);
  storage.removeItem(handoffKey);storage.removeItem(legacyKey);
  if(raw){const handoff=JSON.parse(raw);
   if(navigation==='navigate'&&referrer&&new URL(referrer).origin===new URL(href).origin&&handoff.destination===href&&handoff.expires>now()&&/^[a-f0-9]{64}$/.test(handoff.secret))secret=handoff.secret;
  }
 }catch{/* Storage may be disabled; a fresh in-memory visit still works. */}
 return {secret,transfer(destination:string){
  try{storage.removeItem(handoffKey);if(new URL(destination).origin===new URL(href).origin)storage.setItem(handoffKey,JSON.stringify({secret,destination,expires:now()+10000}));}catch{/* A navigation without storage starts a new visit. */}
 }};
}
let visit:ReturnType<typeof createTemporarySourceVisit>|undefined;
export function getSourceVisitSecret(){
 if(!visit){
  visit=createTemporarySourceVisit({storage:sessionStorage,href:location.href,referrer:document.referrer,navigation:(performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming|undefined)?.type??'navigate',random:()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('')});
  // Only a deliberate same-tab Cuelo link passes the capability to the next page.
  // It is consumed there, rather than kept for later visits or restored tabs.
  window.addEventListener('click',event=>{
   if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
   const anchor=event.target instanceof Element?event.target.closest('a'):null;
   if(anchor?.href&&!anchor.hasAttribute('download')&&(!anchor.target||anchor.target==='_self'))visit!.transfer(anchor.href);
  });
  window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
 }
 return visit.secret;
}
