// Host identities validate the supplied environment; they are not connection URLs.
const DEVELOPMENT='calculating-gecko-263.convex.cloud';
const PRODUCTION='deafening-frog-846.convex.cloud';
export function authReturnUrl(value:string,backend:string,defaultOrigin:string){
 const environment=new URL(backend);
 if(environment.protocol!=='https:'||environment.port!==''||environment.origin!==backend||![DEVELOPMENT,PRODUCTION].includes(environment.hostname))throw Error('Invalid sign-in environment.');
 const origins=[backend.replace('.convex.cloud','.convex.site'),...(environment.hostname===DEVELOPMENT?['http://127.0.0.1:5173']:[])];
 if(!origins.includes(defaultOrigin)||value.startsWith('//'))throw Error('Invalid sign-in return.');
 const url=new URL(value,defaultOrigin);
 const view=url.searchParams.get('view');
 if(!origins.includes(url.origin)||url.username||url.password||url.pathname!=='/'||url.hash||url.searchParams.getAll('view').length!==1||!['home','sources','account','extension-auth'].includes(view??''))throw Error('Invalid sign-in return.');
 const keys=[...url.searchParams.keys()];
 if(keys.some(key=>key!=='view'&&(view!=='extension-auth'||key!=='state')))throw Error('Invalid sign-in return.');
 if(view==='extension-auth'&&(url.searchParams.getAll('state').length!==1||! /^[a-f0-9]{64}$/.test(url.searchParams.get('state')??'')))throw Error('Invalid sign-in return.');
 return url.href;
}
