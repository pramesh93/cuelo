export const LONG_PASTED_PASSAGE_CHARACTERS=600;
export type SourceWebsite={baseURL:string;sources:Array<{id:string;title:string;kind:string}>};
export function sourceEvidenceLink(passage:{text:string;ordinal:number;sourceId?:string;sourceTitle?:string},source:{id:string;kind:string;title:string}|null,website?:SourceWebsite){
 if(!website)return null;
 const id=passage.sourceId??source?.id;if(!id)return null;
 const entry=website.sources.find(s=>s.id===id)??(source?.id===id?source:null);
 if(!entry)return null;
 const url=new URL('/',website.baseURL);url.searchParams.set('view','content');url.searchParams.set('source',id);url.searchParams.set('passage',String(passage.ordinal%1000));
 return {id,title:passage.sourceTitle??entry.title,href:url.toString(),inline:entry.kind==='text'&&passage.text.length<=LONG_PASTED_PASSAGE_CHARACTERS};
}
