// Observes English Meet controls only; no panel is injected into the meeting.
let reported=false;
setInterval(()=>{const state=globalThis.cueloProbeMeetingState(document,location.pathname);if(state==='left'&&!reported){reported=true;void chrome.runtime.sendMessage({type:'left'}).catch(()=>{});}if(state==='joined')reported=false;},500);

chrome.runtime.onMessage.addListener((message,_sender,reply)=>{if(message.type==='call-state')reply({joined:globalThis.cueloProbeMeetingState(document,location.pathname)==='joined'});});
