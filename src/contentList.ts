export type ContentEntry={id:string;title:string;kind:string;createdAt:number;updatedAt:number;version:number;url:string|null};
export type ContentSort='newest'|'oldest'|'modified'|'name';
export function contentList<T extends ContentEntry>(items:T[],search:string,kind:string,sort:ContentSort){
 const needle=search.trim().toLocaleLowerCase();return items.filter(item=>(kind==='all'||item.kind===kind)&&(!needle||item.title.toLocaleLowerCase().includes(needle))).sort((a,b)=>sort==='name'?a.title.localeCompare(b.title):sort==='oldest'?a.createdAt-b.createdAt:sort==='modified'?b.updatedAt-a.updatedAt:b.createdAt-a.createdAt);
}
