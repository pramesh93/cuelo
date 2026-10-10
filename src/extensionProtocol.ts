// Chrome messages use JSON; only a single 50ms PCM block crosses at a time.
export function decodeMeetingFrame(value:unknown):ArrayBuffer {
 if(typeof value!=='string'||value.length!==2136)throw new Error('Unreadable meeting audio.');
 const bytes=atob(value);if(bytes.length!==1600)throw new Error('Unexpected meeting audio format.');
 const frame=new Uint8Array(1600);for(let i=0;i<bytes.length;i++)frame[i]=bytes.charCodeAt(i);return frame.buffer;
}
export type ExtensionMode='generic'|'document';
export function validExtensionId(value:string|null):value is string{return !!value&&/^[a-p]{32}$/.test(value);}
