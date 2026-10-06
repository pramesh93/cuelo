"use node";
import ipaddr from 'ipaddr.js';
import {lookup} from 'node:dns/promises';
import {request} from 'node:https';
import {isIP} from 'node:net';
export function isPublicAddress(address:string) {
 try {const parsed=ipaddr.parse(address);return parsed.range()==='unicast' && !(parsed.kind()==='ipv6' && (parsed as ipaddr.IPv6).isIPv4MappedAddress());}catch{return false;}
}
export function publicPageUrl(value:string):URL {
 if(value.length>2048)throw new Error('Use a shorter public webpage link.');
 let url:URL;try{url=new URL(value.trim());}catch{throw new Error('Enter a public https webpage link.');}
 const host=url.hostname.replace(/^\[|\]$/g,'');
 if(url.protocol!=='https:'||url.username||url.password||url.port||!host.includes('.')&&!isIP(host)||/(^|\.)(localhost|local|internal|home|lan|test|invalid)$/.test(host)||isIP(host)&&!isPublicAddress(host))throw new Error('Use a public https webpage. Private addresses, credentials and custom ports are not allowed.');
 url.hash='';return url;
}
export async function fetchPublicPage(value:string):Promise<{html:string;url:string}> {
 const deadline=Date.now()+15000;let url=publicPageUrl(value);
 for(let hop=0;hop<5;hop++) {
  const host=url.hostname.replace(/^\[|\]$/g,'');
  const addresses=isIP(host)?[{address:host,family:isIP(host)}]:await Promise.race([lookup(host,{all:true}),new Promise<never>((_,reject)=>setTimeout(()=>reject(new Error('The webpage took too long to load.')),Math.max(1,deadline-Date.now())))]);
  if(!addresses.length||addresses.some(a=>!isPublicAddress(a.address)))throw new Error('This webpage resolves to a private or restricted address. Use a public page.');
  const address=addresses[0];
  const response=await new Promise<{status:number;location?:string;type:string;body:Buffer}>((resolve,reject)=>{
   const req=request(url,{agent:false,headers:{'Accept':'text/html','Accept-Encoding':'identity','User-Agent':'Cuelo-source-reader/1.0'},lookup:(_host,options,callback)=>options.all?callback(null,[address] as never):callback(null,address.address,address.family)},res=>{
    const status=res.statusCode??500;
    if([301,302,303,307,308].includes(status)){res.destroy();resolve({status,location:res.headers.location,type:'',body:Buffer.alloc(0)});return;}
    if(status!==200){res.destroy();reject(new Error('The public webpage could not be read. Check the link or paste its text.'));return;}
    if(!res.headers['content-type']?.includes('text/html')||res.headers['content-encoding']&&res.headers['content-encoding']!=='identity'){res.destroy();reject(new Error('This link is not a readable public HTML page. Upload a document or paste text.'));return;}
    let size=0;const chunks:Buffer[]=[];res.on('data',(chunk:Buffer)=>{size+=chunk.length;if(size>2000000){req.destroy(new Error('The webpage exceeds the 2 MB download limit. Paste a smaller excerpt instead.'));return;}chunks.push(chunk);});
    res.on('end',()=>resolve({status,type:res.headers['content-type']??'',body:Buffer.concat(chunks)}));res.on('error',reject);
   });
   const timer=setTimeout(()=>req.destroy(new Error('The webpage took too long to load. Try again or paste text.')),Math.max(1,deadline-Date.now()));req.on('close',()=>clearTimeout(timer));req.on('error',reject);req.end();
  });
  if(response.location){url=publicPageUrl(new URL(response.location,url).href);continue;}
  return {html:response.body.toString('utf8'),url:url.href};
 }
 throw new Error('This link redirects too many times. Use the final public page link.');
}
