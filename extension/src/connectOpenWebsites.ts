import {allowedWebsite} from '../../src/auth/sharedSession';
// Connect the packaged bridge only to this environment's already-open website tabs.
export async function connectOpenWebsites(browser:any,backend:string){
 const tabs=await browser.tabs.query({});
 await Promise.allSettled(tabs.filter((tab:any)=>{try{return Number.isInteger(tab.id)&&allowedWebsite(new URL(tab.url).origin,backend);}catch{return false;}}).map((tab:any)=>browser.scripting.executeScript({target:{tabId:tab.id},files:['website-auth-bridge.js']})));
}
