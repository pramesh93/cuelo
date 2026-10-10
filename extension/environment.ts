const LIVE='https://deafening-frog-846.convex.cloud';
const TEST='https://calculating-gecko-263.convex.cloud';
export function extensionEnvironment(env:Record<string,string|undefined>){
 const selection=env.CUELO_EXTENSION_ENV??'development';
 if(!['production','development'].includes(selection))throw Error('Choose production or development for the Cuelo sidebar.');
 const backend=selection==='development'?TEST:LIVE;
 if(![LIVE,TEST].includes(backend))throw Error('Use an established Cuelo account environment.');
 return {backend,siteOrigin:backend.replace('.convex.cloud','.convex.site'),returnOrigin:backend===LIVE?'https://deafening-frog-846.convex.site':'http://127.0.0.1:5173'};
}
