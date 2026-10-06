import {encodeQuestionAudio, MAX_QUESTION_SECONDS, QUESTION_SAMPLE_RATE} from "./audio";

export interface QuestionCapture {
  stop: () => Promise<ArrayBuffer>;
  cancel: () => void;
}

export async function startQuestionCapture(options: {
  signal: AbortSignal;
  onInterrupted: () => void;
  onLimit: () => void;
}): Promise<QuestionCapture> {
  if (!navigator.mediaDevices?.getUserMedia || !window.AudioWorkletNode) {
    throw new Error("Microphone input needs desktop Chrome on a secure page. You can type your question below.");
  }
  const stream = await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true},video:false});
  if (options.signal.aborted) {stream.getTracks().forEach(track=>track.stop()); throw new DOMException("Cancelled","AbortError");}
  let context:AudioContext;
  try {context=new AudioContext({sampleRate:QUESTION_SAMPLE_RATE});}
  catch(error) {stream.getTracks().forEach(track=>track.stop());throw error;}
  let source: MediaStreamAudioSourceNode | null = null;
  let recorder: AudioWorkletNode | null = null;
  let chunks: Float32Array[] = [];
  let frames = 0;
  let released = false;
  let deadline: ReturnType<typeof setTimeout> | undefined;
  const release = () => {
    if (released) return;
    released = true;
    clearTimeout(deadline);
    options.signal.removeEventListener("abort",cancel);
    stream.getTracks().forEach(track=>{track.onended=null;track.stop();});
    if(recorder) {recorder.port.onmessage=null;recorder.disconnect();}
    source?.disconnect();
    void context.close().catch(()=>{});
  };
  const cancel = () => {release();chunks=[];};
  options.signal.addEventListener("abort",cancel,{once:true});
  try {
    await context.audioWorklet.addModule(`${import.meta.env.BASE_URL}question-recorder.js`);
    if(options.signal.aborted) throw new DOMException("Cancelled","AbortError");
    source=context.createMediaStreamSource(stream);
    recorder=new AudioWorkletNode(context,"question-recorder",{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[1],channelCount:1,channelCountMode:"explicit"});
    recorder.port.onmessage = (event: MessageEvent<Float32Array>) => {
      if(released) return;
      if(frames+event.data.length > context.sampleRate*MAX_QUESTION_SECONDS) {
        cancel();options.onLimit();return;
      }
      chunks.push(event.data);frames+=event.data.length;
    };
    stream.getAudioTracks().forEach(track=>{track.onended=()=>{cancel();options.onInterrupted();};});
    source.connect(recorder);
    recorder.connect(context.destination); // The processor emits silence, never microphone playback.
    await context.resume();
    if(options.signal.aborted) throw new DOMException("Cancelled","AbortError");
    deadline=setTimeout(()=>{cancel();options.onLimit();},MAX_QUESTION_SECONDS*1000);
    return {
      cancel,
      stop: async () => {
        if(released) throw new Error("Microphone capture has stopped. Speak your question again.");
        release();
        const samples=new Float32Array(frames);
        let offset=0;
        for(const chunk of chunks) {samples.set(chunk,offset);offset+=chunk.length;}
        chunks=[];
        if(samples.length < context.sampleRate*0.1) throw new Error("That was too short to hear. Try speaking again.");
        if(!samples.some(value=>Math.abs(value)>0.0001)) throw new Error("No microphone audio was heard. Check your microphone and try again.");
        if(context.sampleRate === QUESTION_SAMPLE_RATE) return encodeQuestionAudio(samples);
        const offline=new OfflineAudioContext(1,Math.floor(frames*QUESTION_SAMPLE_RATE/context.sampleRate),QUESTION_SAMPLE_RATE);
        const buffer=offline.createBuffer(1,frames,context.sampleRate);
        buffer.copyToChannel(samples,0);
        const input=offline.createBufferSource();input.buffer=buffer;input.connect(offline.destination);input.start();
        const rendered=await offline.startRendering();
        return encodeQuestionAudio(rendered.getChannelData(0));
      },
    };
  } catch(error) {cancel();throw error;}
}
