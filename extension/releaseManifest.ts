export const RELEASE_VERSION='0.1.1';
export function releaseManifest(){
 const site='https://deafening-frog-846.convex.site';
 return {
  manifest_version:3,name:'Cuelo',version:RELEASE_VERSION,
  description:'Get short answers beside Google Meet. Sign in for up to three free calls or 90 minutes of listening.',
  minimum_chrome_version:'116',
  icons:{16:'icons/icon-16.png',32:'icons/icon-32.png',48:'icons/icon-48.png',128:'icons/icon-128.png'},
  permissions:['sidePanel','storage','offscreen','scripting'],
  host_permissions:['https://deafening-frog-846.convex.cloud/*',`${site}/*`,'https://meet.google.com/*'],
  background:{service_worker:'shared-auth-worker.js',type:'module'},
  action:{default_title:'Open Cuelo',default_icon:{16:'icons/icon-16.png',32:'icons/icon-32.png'}},
  side_panel:{default_path:'auth-check.html'},
  content_scripts:[
   {matches:['https://meet.google.com/*'],js:['meeting-state.js','call-end.js','meet-audio-core.js','meet-audio.js'],run_at:'document_idle'},
   {matches:[`${site}/*`],js:['website-auth-bridge.js'],run_at:'document_start'},
  ],
  web_accessible_resources:[{resources:['meet-pcm.js'],matches:['https://meet.google.com/*']}],
 };
}
