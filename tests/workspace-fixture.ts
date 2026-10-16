// In-memory backend records, fictional identities and no external services.
export function workspaceFixture(){
 let subject:string|null='fictional-user|session',serial=0;const tables=new Map<string,Map<string,any>>();const table=(name:string)=>{if(!tables.has(name))tables.set(name,new Map());return tables.get(name)!;};
 const ctx:any={auth:{getUserIdentity:async()=>subject?{subject}:null},db:{
 get:async(id:string)=>{for(const t of tables.values())if(t.has(id))return {...t.get(id)};return null;},
 insert:async(name:string,row:any)=>{const id=`${name}-${++serial}`;table(name).set(id,{_id:id,_creationTime:Date.now()+serial,...row});return id;},
 patch:async(id:string,values:any)=>{for(const t of tables.values())if(t.has(id))Object.assign(t.get(id),values);},delete:async(id:string)=>{for(const t of tables.values())t.delete(id);},
 query:(name:string)=>({withIndex:(index:string,select:(q:any)=>any)=>{const rules:Array<(r:any)=>boolean>=[];const q:any={eq:(key:string,v:any)=>{rules.push(r=>r[key]===v);return q;},lte:(key:string,v:any)=>{rules.push(r=>r[key]<=v);return q;},gt:(key:string,v:any)=>{rules.push(r=>r[key]>v);return q;}};select(q);let direction='asc';const rows=()=>[...table(name).values()].filter(r=>rules.every(f=>f(r))).sort((a,b)=>{const difference=index==='by_owner_saved_created'?(a.createdAt??0)-(b.createdAt??0)||a._creationTime-b._creationTime:a._creationTime-b._creationTime;return direction==='desc'?-difference:difference;}).map(r=>({...r}));const result:any={order:(value:string)=>{direction=value;return result;},take:async(n:number)=>rows().slice(0,n),paginate:async(opts:any)=>{const offset=Number(opts.cursor??0),all=rows(),end=offset+opts.numItems;return {page:all.slice(offset,end),isDone:end>=all.length,continueCursor:String(end)};}};return result;}}),
 }};return {ctx,table,setUser:(id:string|null)=>subject=id};
}
