import type {SourceContent} from './sourceValues';
export const MAX_SOURCE_CHARS=200000;
export const MAX_SOURCE_BYTES=10*1024*1024;
export const MAX_PASSAGES=500;
export function validateContent(source:SourceContent) {
 if(!source.title.trim()||source.title.length>160)throw new Error('Give your source a name of at most 160 characters.');
 const size=source.passages.reduce((n,p)=>n+p.text.length,0);
 if(!size||!source.passages.some(p=>p.text.trim()))throw new Error('No readable text was found. Scans need a text-based PDF; Cuelo does not read images.');
 if(size>MAX_SOURCE_CHARS||source.passages.length>MAX_PASSAGES)throw new Error('This source contains too much text. Use a smaller source (up to 200,000 characters and 500 passages). Nothing was cut off.');
 if(new TextEncoder().encode(JSON.stringify(source)).byteLength>800000)throw new Error('This source contains too much text to store safely. Use a smaller source.');
 if(source.pageCount!==null&&(!Number.isInteger(source.pageCount)||source.pageCount<1||source.pageCount>50))throw new Error('Documents must contain at most 50 pages.');
 if(source.passages.some((p,i)=>p.ordinal!==i||!p.text.trim()||!p.reference||p.reference.length>200||p.text.length>8000))throw new Error('Source passages could not be read safely. Use a smaller source.');
 return source;
}
