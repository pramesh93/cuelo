import '../meet/auth-worker.js';
import {ConvexHttpClient} from 'convex/browser';
import {api} from '../../convex/_generated/api';
import {createSharedSession,sessionKey,allowedWebsite,authSenderAllowed,type AuthRequest} from '../../src/auth/sharedSession';
const browser=(globalThis as any).chrome;
const backend=import.meta.env.VITE_CONVEX_URL;
const key=sessionKey(backend),oldNamespace=('cuelo-sidebar-'+backend).replace(/[^a-zA-Z0-9]/g,'');
const service=createSharedSession({
 backend,
 load:async()=> (await browser.storage.local.get(key))[key]??null,
 save:async state=>{await browser.storage.local.set({[key]:state});if(state.established)await browser.storage.local.remove(['__convexAuthJWT_'+oldNamespace,'__convexAuthRefreshToken_'+oldNamespace]);},
 legacy:async()=>{const jwt='__convexAuthJWT_'+oldNamespace,refresh='__convexAuthRefreshToken_'+oldNamespace;const saved=await browser.storage.local.get([jwt,refresh]);return typeof saved[jwt]==='string'&&typeof saved[refresh]==='string'?{token:saved[jwt],refreshToken:saved[refresh]}:null;},
 call:async(name,args,token)=>{const client=new ConvexHttpClient(backend,{logger:false});if(token)client.setAuth(token);return client.action(name==='signIn'?api.auth.signIn:api.auth.signOut,args as any);},
 validate:async token=>{const client=new ConvexHttpClient(backend,{logger:false});client.setAuth(token);return client.query(api.auth.isAuthenticated,{});},
 stopCall:async()=>{
  const bound=(await browser.storage.session.get('cueloCallBinding')).cueloCallBinding;
  if(bound?.nonce)await browser.tabs.sendMessage(bound.tabId,{to:'meet-audio',type:'stop',nonce:bound.nonce}).catch(()=>{});
  const contexts=await browser.runtime.getContexts({contextTypes:['OFFSCREEN_DOCUMENT'],documentUrls:[browser.runtime.getURL('call.html')]});
  if(contexts.length){await Promise.race([browser.runtime.sendMessage({to:'call',type:'stop',message:'You signed out or changed account. Cuelo stopped.'}),new Promise(resolve=>setTimeout(resolve,3000))]).catch(()=>{});await browser.offscreen.closeDocument();}
 },
});
browser.runtime.onMessage.addListener((message:any,sender:any,reply:any)=>{
 if(message?.type!=='shared-auth')return;
 if(!authSenderAllowed(sender,browser.runtime.id,backend)||message.backend!==backend){reply({error:'This page cannot access this Cuelo sign-in.'});return;}
 const request=message.request as AuthRequest;
 if(JSON.stringify(message).length>50000||!request||!['state','import','signIn','refresh','signOut'].includes(request.operation)){reply({error:'Invalid sign-in request.'});return;}
 void service.run(request).then(reply).catch(()=>reply({error:'Cuelo could not update your sign-in. Check your connection and try again.'}));return true;
});
browser.storage.onChanged.addListener((changes:any,area:string)=>{
 if(area!=='local'||!changes[key])return;
 // Notifications contain no tokens; each authorised surface requests its own state.
 void browser.tabs.query({}).then((tabs:any[])=>Promise.allSettled(tabs.filter(tab=>{try{return allowedWebsite(new URL(tab.url).origin,backend);}catch{return false;}}).map(tab=>browser.tabs.sendMessage(tab.id,{type:'shared-auth-changed',backend})))).catch(()=>{});
});
