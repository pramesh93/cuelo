// Prototype heuristic for English Meet UI. Unknown states never imply a joined call.
globalThis.cueloProbeMeetingState=(page,pathname)=>{
 if(pathname==='/'||pathname==='')return 'home';
 const text=page.body?.innerText??'';
 if(/you(?:'|’)ve left the meeting|you left the meeting|you(?:'|’)ve been removed from the meeting/i.test(text))return 'left';
 const controls=page.querySelectorAll('button,[role="button"]');
 for(const control of controls){
  if(!control.getClientRects().length)continue;
  const label=control.getAttribute('aria-label')??control.getAttribute('data-tooltip')??control.getAttribute('title')??'';
  if(/^leave(?: the)? (?:call|meeting)\b/i.test(label.trim()))return 'joined';
 }
 return 'waiting';
};
