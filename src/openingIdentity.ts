const key='cuelo-opening-browser';
export async function getOpeningBrowserSecret():Promise<string>{
 const read=()=>{let value=localStorage.getItem(key);if(!value||!/^[a-f0-9]{64}$/.test(value)){value=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');localStorage.setItem(key,value);}return value;};
 // A browser-wide lock prevents simultaneous new tabs creating different identities.
 if(!navigator.locks)throw Error('Use an up-to-date desktop Chrome browser to try Cuelo.');
 try{return await navigator.locks.request('cuelo-opening-browser',read);}catch{throw Error('Allow browser storage to try Cuelo, or sign in.');}
}
