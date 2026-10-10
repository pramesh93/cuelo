const el=id=>document.getElementById(id);let snapshot=null,working=false,actionError='',lastState='idle',selectionTouched=false,polling=false;
async function restore(){const saved=await chrome.storage.session.get('selection');if(!selectionTouched&&saved.selection){el('mode').value=['generic','document'].includes(saved.selection.mode)?saved.selection.mode:'';el('source').value=saved.selection.sourceId??'';}}
function remember(){selectionTouched=true;void chrome.storage.session.set({selection:{mode:el('mode').value,sourceId:el('source').value}}).catch(()=>{actionError='Your choice could not be remembered.';});render();}
el('mode').onchange=remember;el('source').onchange=remember;
function render(){
 if(!snapshot)return;const view=snapshot.view,active=['connecting','listening','paused'].includes(view?.state)||snapshot.connecting||snapshot.capturing;
 const setupAllowed=snapshot.meetingJoined&&snapshot.authorised&&!active;
 el('connection').hidden=!setupAllowed||!!view?.signedIn;
 el('setup').hidden=!setupAllowed||!view?.signedIn;
 el('controls').hidden=!active;el('pause').hidden=view?.state!=='listening';el('resume').hidden=view?.state!=='paused';
 el('stop').disabled=working;el('pause').disabled=working||!!view?.controlsBusy;el('resume').disabled=working||!!view?.controlsBusy||snapshot.connecting||!snapshot.meetingJoined;
 const mode=el('mode').value;el('document').hidden=mode!=='document';el('generic').hidden=mode!=='generic';
 const allowed=setupAllowed&&view?.signedIn&&view.invited&&view.enabled;
 el('start').disabled=working||!!view?.controlsBusy||!allowed||!mode||mode==='document'&&el('source').value!==view?.source?.id;
 el('mode').disabled=working;el('source').disabled=working;
 let notice=actionError||snapshot.message;
 if(setupAllowed&&view?.signedIn&&!view.invited)notice='Live calls are available to invited testers only.';
 else if(setupAllowed&&view?.signedIn&&!view.enabled)notice='Live listening testing is not enabled. No paid connection will start.';
 el('status').textContent=notice??'Checking Cuelo…';el('state').textContent=active?(view?.state==='paused'?'Paused':snapshot.connecting?'Connecting':'Listening'):'Audio off';
 el('mode-summary').textContent=view?.mode==='generic'?'Generic answers · Not from your document':view?.selectedSourceTitle?`Answers from ${view.selectedSourceTitle}`:'Answers from your selected source';
 el('warning').hidden=!view?.warning;
 const result=view?.result;el('answer').hidden=!active||(!result&&!view?.busy);
 el('question').textContent=result?.question??(view?.busy?'Finding the answer. Listening continues.':'');
 el('provenance').hidden=result?.mode!=='generic';el('answer-text').replaceChildren();el('refusal').hidden=true;el('citation').textContent='';el('excerpt').textContent='';el('evidence').hidden=true;el('timing').textContent='';
 if(result){if(result.status==='supported'||result.status==='generic'){for(const line of result.bullets??[]){const item=document.createElement('li');item.textContent=line;el('answer-text').appendChild(item);}}else{el('refusal').hidden=false;el('refusal').textContent=result.message??'';}if(result.status==='supported'){el('citation').textContent=[...(result.citations??[]).map(c=>c.reference),result.source?.title].filter(Boolean).join(' · ');el('excerpt').textContent=(result.citations??[]).map(c=>c.text).join('\n\n');el('evidence').hidden=!(result.citations??[]).length;}if(typeof result.elapsedMs==='number')el('timing').textContent=`Answer processing: ${(result.elapsedMs/1000).toFixed(1)} seconds`;}
}
async function refresh(){if(polling||working)return;polling=true;try{const previous=snapshot;const result=await chrome.runtime.sendMessage({type:'status'});if(result.error){actionError=result.error;return;}snapshot=result;
 if(snapshot.authorised&&!previous?.authorised)actionError='';
 const source=snapshot.view?.source,choice=el('source').value;
 if(el('source').dataset.id!==(source?.id??'')){el('source').replaceChildren(new Option('Choose your source',''));if(source)el('source').appendChild(new Option(source.title,source.id));el('source').dataset.id=source?.id??'';el('source').value=choice===source?.id?choice:'';selectionTouched=false;}
 await restore();el('source-help').textContent=source?'One active saved source.':'No saved source. Add one in the Cuelo tab before starting document answers.';
 if(lastState!==snapshot.view?.state){actionError='';lastState=snapshot.view?.state??'idle';}
 render();}catch{el('status').textContent='Extension connection unavailable. Reload Cuelo’s extension.';}finally{polling=false;}}
async function request(type,extra={}){if(working)return;working=true;actionError='';render();try{const result=await chrome.runtime.sendMessage({type,...extra});if(result.error)actionError=result.error;}catch{actionError='Cuelo could not connect. Keep its website tab open.';}finally{working=false;await refresh();render();}}
el('start').onclick=()=>request('start',{mode:el('mode').value,sourceId:el('mode').value==='document'?el('source').value:undefined});el('pause').onclick=()=>request('pause');el('resume').onclick=()=>request('resume');el('stop').onclick=()=>request('stop');el('connect').onclick=()=>request('connect');el('configure').onclick=()=>request('configure',{origin:el('origin').value});
void chrome.storage.local.get('websiteOrigin').then(saved=>{if(saved.websiteOrigin)el('origin').value=saved.websiteOrigin;});void refresh();setInterval(()=>{void refresh();},500);
