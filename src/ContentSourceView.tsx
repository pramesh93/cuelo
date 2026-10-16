import {Component,useEffect,type ReactNode} from 'react';
import {useQuery} from 'convex/react';
import {api} from '../convex/_generated/api';
import type {Id} from '../convex/_generated/dataModel';
import {sourceLabel,WorkspaceIcon} from './Workspace';
function Unavailable(){return <p className="workspace-error" role="alert">This source is unavailable. It may have been deleted or you may need to use the account that owns it.</p>;}
class SourceReadBoundary extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false};static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?<Unavailable/>:this.props.children;}
}
export function ContentSourceView({sourceId,onBack}:{sourceId:string;onBack:()=>void}){
 return <><header className="workspace-heading"><button className="workspace-text-button source-back" onClick={onBack}><WorkspaceIcon name="arrow"/>Back to content</button><h1>Source</h1><p>Read your saved content.</p></header><section className="glass-panel source-reading" aria-label="Saved source"><SourceReadBoundary key={sourceId}>{/^[a-z0-9_-]{1,128}$/i.test(sourceId)?<ReadSavedSource sourceId={sourceId}/>:<Unavailable/>}</SourceReadBoundary></section></>;
}
function ReadSavedSource({sourceId}:{sourceId:string}){
 const data=useQuery(api.sourceLibrary.read,{id:sourceId as Id<'sources'>});
 const requested=new URLSearchParams(location.search).get('passage');const ordinal=requested!==null&&/^\d{1,3}$/.test(requested)?Number(requested):null;
 useEffect(()=>{if(!data||ordinal===null)return;const target=document.getElementById(`source-passage-${ordinal}`);target?.scrollIntoView({block:'center'});target?.focus({preventScroll:true});},[data?.entry.id,ordinal]);
 if(data===undefined)return <p role="status">Opening your source…</p>;
 if(data===null)return <Unavailable/>;
 return <><div className="source-reading-heading"><h2>{data.entry.title}</h2><span className="source-type-badge">{sourceLabel(data.entry.kind)}</span></div>{!data.passages.length?<p>This source has no readable text.</p>:data.passages.map(p=><section key={p.ordinal} id={`source-passage-${p.ordinal}`} className="source-reading-passage" tabIndex={-1} data-highlighted={p.ordinal===ordinal}><h3>{p.reference}</h3><p>{p.text}</p></section>)}</>;
}
