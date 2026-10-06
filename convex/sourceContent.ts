"use node";
import {load} from 'cheerio';
import {unzipSync} from 'fflate';
import type {SourceContent,SourcePassage} from './sourceValues';
import {MAX_SOURCE_CHARS,MAX_SOURCE_BYTES,validateContent} from './sourceLimits';
export {MAX_SOURCE_CHARS} from './sourceLimits';
function add(passages:SourcePassage[],text:string,reference?:string) {
 const clean=text.replace(/\r\n?/g,'\n').trim();if(!clean)return;
 // Split without dropping characters; references remain attached to each piece.
 for(let offset=0;offset<clean.length;offset+=4000)passages.push({ordinal:passages.length,reference:reference?.slice(0,200)||`Passage ${passages.length+1}`,text:clean.slice(offset,offset+4000)});
}
export function textSource(title:string,text:string):SourceContent {
 if(text.length>MAX_SOURCE_CHARS)throw new Error('This source contains too much text. Use up to 200,000 characters. Nothing was cut off.');
 const passages:SourcePassage[]=[];for(const paragraph of text.split(/\n\s*\n/))add(passages,paragraph);
 return validateContent({title:title.trim(),kind:'text',url:null,pageCount:null,passages});
}
export function htmlSource(html:string,url:string):SourceContent {
 const $=load(html);
 // Page tools are not evidence. Preserve article headers, including their real heading.
 $('script,style,noscript,nav,footer,form,iframe,button,[role="button"],[role="navigation"],.breadcrumbs-row,.theme-doc-toc-mobile,.theme-doc-toc-desktop,.hash-link').remove();
 $('header').each((_,node)=>{if(!$(node).closest('article,main').length)$(node).remove();});
 const root=$('article').first().length?$('article').first():$('main').first().length?$('main').first():$('body');
 const title=($('h1').first().text()||$('title').first().text()||new URL(url).hostname).trim().slice(0,160);
 const passages:SourcePassage[]=[];let reference:string|undefined;
 let pending='';
 const flush=()=>{add(passages,pending.replace(/\s+/g,' '),reference);pending='';};
 const walk=(node:import('domhandler').AnyNode)=>{
  if(node.type==='text'){pending+=node.data;return;}
  if(!('children' in node))return;
  const tag='tagName' in node?node.tagName:'';
  if(/^h[1-6]$/.test(tag)){flush();reference=$(node).text().replace(/\s+/g,' ').trim()||undefined;return;}
  if(['p','div','li','pre','td','th','section','br'].includes(tag))flush();
  for(const child of node.children)walk(child);
  if(['p','div','li','pre','td','th','section','br'].includes(tag))flush();
 };
 for(const node of root.toArray())walk(node);flush();
 return validateContent({title,kind:'webpage',url,pageCount:null,passages});
}
export async function parseUpload(name:string,data:Uint8Array):Promise<SourceContent> {
 if(!data.length||data.length>MAX_SOURCE_BYTES)throw new Error('Choose a file no larger than 10 MB.');
 const title=name.trim().slice(0,160);if(!title)throw new Error('Your file needs a name.');
 if(/\.pdf$/i.test(name)) {
  if(new TextDecoder().decode(data.slice(0,5))!=='%PDF-')throw new Error('Choose a valid PDF file.');
  const {PDFParse}=await import('pdf-parse');
  const parser=new PDFParse({data:new Uint8Array(data),isEvalSupported:false});
  try {
   const info=await parser.getInfo();if(info.total>50)throw new Error('Documents must contain at most 50 pages.');
   const result=await parser.getText();const passages:SourcePassage[]=[];
   for(const page of result.pages){if(!page.text.trim())throw new Error('At least one page has no readable text. Use a text-based PDF; scanned pages need OCR, which is outside this version.');add(passages,page.text,`Page ${page.num}`);}
   return validateContent({title,kind:'pdf',url:null,pageCount:info.total,passages});
  } finally {await parser.destroy();}
 }
 if(!/\.docx$/i.test(name))throw new Error('Choose a PDF or Word .docx file. Save older .doc files as .docx or PDF first.');
 // Inflate only bounded XML entries, never external relationships or embedded files.
 const entries=unzipSync(data,{filter:file=>{
  if(!/^(?:docProps\/app\.xml|word\/(?:document|footnotes|endnotes|header\d+|footer\d+)\.xml)$/.test(file.name))return false;
  if(file.originalSize>2000000)throw new Error('The Word file contains too much text. Export a smaller PDF.');return true;
 }});
 const decode=(path:string)=>{if(!entries[path])throw new Error('This Word file has no readable document or saved page count. Export it as a PDF.');return new TextDecoder().decode(entries[path]);};
 const metadata=load(decode('docProps/app.xml'),{xml:true});const pageCount=Number(metadata('Pages').text());
 if(!Number.isInteger(pageCount)||pageCount<1)throw new Error('The Word page count could not be checked. Save it in Word or export it as a PDF.');
 if(pageCount>50)throw new Error('Documents must contain at most 50 pages.');
 decode('word/document.xml');const passages:SourcePassage[]=[];
 for(const path of Object.keys(entries).filter(path=>path.startsWith('word/')).sort()){
 const xml=load(decode(path),{xml:true});
 xml('w\\:p').each((_,p)=>{if(xml(p).parents('w\\:p').length)return;let text='';xml(p).find('w\\:t,w\\:tab,w\\:br,w\\:cr').each((_,node)=>{text+=node.tagName==='w:t'?xml(node).text():node.tagName==='w:tab'?'\t':'\n';});add(passages,text);});
 }
 return validateContent({title,kind:'docx',url:null,pageCount,passages});
}
