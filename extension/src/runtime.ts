export type RuntimeMessage=Record<string,unknown>;
type Sender={id?:string;url?:string;tab?:{id?:number}};
export type Runtime={id:string;getURL:(file:string)=>string;sendMessage:(message:RuntimeMessage)=>Promise<Record<string,any>>;onMessage:{addListener:(handler:(message:RuntimeMessage,sender:Sender,reply:(result:unknown)=>void)=>boolean|void)=>void;removeListener:(handler:unknown)=>void}};
export const runtime=(globalThis as unknown as {chrome:{runtime:Runtime}}).chrome.runtime;
export async function command(type:string,extra:RuntimeMessage={}){const result=await runtime.sendMessage({type,...extra});if(result.error)throw Error(result.error as string);return result;}
