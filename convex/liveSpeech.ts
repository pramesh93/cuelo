"use node";
import {action} from './_generated/server';
import {internal,api} from './_generated/api';
import {v,ConvexError} from 'convex/values';
export const connect=action({args:{sessionId:v.id('liveCalls')},returns:v.object({token:v.union(v.string(),v.null()),generation:v.number(),deadline:v.number(),message:v.string()}),handler:async(ctx,args):Promise<{token:string|null;generation:number;deadline:number;message:string}>=>{
 const denied=(message:string)=>({token:null,generation:0,deadline:0,message});
 try{const admission=await ctx.runMutation(internal.liveCalls.credentialAdmission,args);
 const response=await fetch('https://api.deepgram.com/v1/auth/grant',{method:'POST',headers:{Authorization:`Token ${process.env.DEEPGRAM_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({ttl_seconds:30}),signal:AbortSignal.timeout(10000)});
 if(!response.ok){await ctx.runMutation(api.liveCalls.change,{...args,state:'stopped'}).catch(()=>{});return denied(response.status===401||response.status===403?'Deepgram cannot issue a temporary listening credential. Check the key permissions in Convex.':'Speech recognition is unavailable. Cuelo stopped; try again later.');}
 const body=await response.json();if(typeof body.access_token!=='string'||body.access_token.length>8192||!Number.isFinite(body.expires_in)||body.expires_in<=0||body.expires_in>60)throw Error('Invalid temporary credential');
 if(!await ctx.runQuery(internal.liveCalls.check,{...args,generation:admission.generation}))return denied('This connection was cancelled.');
 return {token:body.access_token,generation:admission.generation,deadline:admission.deadline,message:''};
 }catch(error){await ctx.runMutation(api.liveCalls.change,{...args,state:'stopped'}).catch(()=>{});return denied(error instanceof ConvexError&&typeof error.data==='string'?error.data:'Speech recognition could not connect. Cuelo stopped.');}
}});
