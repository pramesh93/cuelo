// Never start a backend/provider session until microphone access succeeds.
export async function prepareSidebarMicrophone(options:{request:()=>Promise<MediaStream>;cancelled:()=>boolean;connect:()=>Promise<unknown>}):Promise<void>{
 let stream:MediaStream;
 try{stream=await options.request();}catch(error){
  const failure=error as {name?:string};
  if(failure?.name==='NotAllowedError')throw Error('Microphone access was not granted. Chrome may have been unable to show its permission prompt in this sidebar.');
  if(failure?.name==='NotFoundError')throw Error('No microphone was found. Connect a microphone and try Start again.');
  if(failure?.name==='NotReadableError')throw Error('Chrome could not use your microphone. Check microphone access in your computer settings.');
  throw error;
 }
 stream.getTracks().forEach(track=>track.stop());if(options.cancelled())return;await options.connect();
}
