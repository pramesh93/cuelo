import {useEffect,useRef,useState} from "react";
import type {ConvexHttpClient} from "convex/browser";
import {api} from "../convex/_generated/api";
import type {FunctionReturnType} from "convex/server";
import {startQuestionCapture,type QuestionCapture} from "./microphone";

type SourceTicket=NonNullable<FunctionReturnType<typeof api.sourcePreparation.prepare>["ticket"]>;
type Phase = "idle" | "requesting" | "listening" | "preparing" | "transcribing" | "answering";
export function SpeechInput({client,disabled,onBegin,onQuestion,onCancel,onActive}: {
  client:ConvexHttpClient;disabled:boolean;onBegin:()=>void;
  onQuestion:(question:string,stoppedAt:number,ticket:SourceTicket)=>Promise<void>;
  onCancel:()=>void;onActive:(active:boolean)=>void;
}) {
  const [phase,setPhase]=useState<Phase>("idle");
  const [message,setMessage]=useState("");
  const [seconds,setSeconds]=useState(0);
  const capture=useRef<QuestionCapture | null>(null);
  const controller=useRef<AbortController | null>(null);
  const generation=useRef(0);
  const startedAt=useRef(0);
  const sourcePreparation=useRef<Promise<FunctionReturnType<typeof api.sourcePreparation.prepare>> | null>(null);
  const discard=(ticket:SourceTicket)=>{void client.mutation(api.preparedSources.discard,{ticket}).catch(()=>{});};
  const cleanup=() => {
    controller.current?.abort();controller.current=null;capture.current?.cancel();capture.current=null;
    const pending=sourcePreparation.current;sourcePreparation.current=null;
    if(pending) void pending.then(result=>{if(result.ticket) discard(result.ticket);}).catch(()=>{});
  };
  function cancel() {
    generation.current++;cleanup();setPhase("idle");onActive(false);onCancel();setMessage("Cancelled. Nothing new will be shown.");
  }
  useEffect(()=>()=>{generation.current++;cleanup();},[]);
  useEffect(()=>{
    const leave=()=>{generation.current++;cleanup();};
    // Backgrounding a tab is normal while using Meet. Only leaving the page ends capture.
    window.addEventListener("pagehide",leave);
    return ()=>{window.removeEventListener("pagehide",leave);};
  });
  useEffect(()=>{
    if(phase!=="listening") return;
    const timer=setInterval(()=>setSeconds(Math.floor((performance.now()-startedAt.current)/1000)),250);
    return ()=>clearInterval(timer);
  },[phase]);
  const fail=(text:string,id:number)=>{
    if(id!==generation.current) return;
    generation.current++;cleanup();setPhase("idle");onActive(false);setMessage(text);
  };
  async function start() {
    const id=++generation.current;
    setMessage("");setPhase("requesting");onActive(true);onBegin();
    const abort=new AbortController();controller.current=abort;
    try {
      const ready=await client.query(api.speechBudget.status,{});
      if(id!==generation.current) return;
      if(!ready.enabled) {fail(ready.message,id);return;}
      const mic=await startQuestionCapture({signal:abort.signal,
        onInterrupted:()=>fail("The microphone disconnected. Reconnect it and speak again.",id),
        onLimit:()=>fail("20-second limit reached. Nothing was sent. Ask a shorter question.",id),
      });
      if(id!==generation.current) {mic.cancel();return;}
      capture.current=mic;startedAt.current=performance.now();setSeconds(0);setPhase("listening");
      // Start the validated fetch while audio is being captured, without waiting for it.
      sourcePreparation.current=client.action(api.sourcePreparation.prepare,{}).catch(()=>({ticket:null,message:"Could not load the source. Check your connection and try again."}));
    } catch(error) {
      const name=error instanceof Error ? error.name : "";
      const text=name==="NotAllowedError" ? "Microphone permission was denied. Allow it in Chrome’s site settings, or type below."
        : name==="NotFoundError" ? "No microphone was found. Connect one, or type your question below."
        : name==="NotReadableError" ? "Chrome couldn’t open your microphone. Check whether another app is using it, or type below."
        : error instanceof Error && !(error instanceof DOMException) ? error.message
        : "Could not start the microphone. Check your connection and Chrome’s microphone settings, or type below.";
      fail(text,id);
    }
  }
  async function finish() {
    const id=generation.current;
    const stoppedAt=performance.now();
    setPhase("preparing");
    let uploaded=false;
    try {
      const audio=await capture.current!.stop();capture.current=null;
      if(id!==generation.current) return;
      const prepared=await sourcePreparation.current;
      if(id!==generation.current) return;
      if(!prepared?.ticket) {fail(prepared?.message ?? "The source could not be prepared. Speak your question again.",id);return;}
      setPhase("transcribing");
      uploaded=true;
      const result=await client.action(api.speech.transcribe,{audio});
      if(id!==generation.current) return;
      if(result.status!=="ok" || !result.transcript) {fail(result.message,id);return;}
      setPhase("answering");
      await onQuestion(result.transcript,stoppedAt,prepared.ticket);
      if(id===generation.current) {cleanup();setPhase("idle");onActive(false);}
    } catch(error) {
      fail(uploaded ? "Could not transcribe your question. Check your connection, or type below." : error instanceof Error ? error.message : "Could not hear your question. Try again.",id);
    }
  }
  const active=phase!=="idle";
  const status=phase==="requesting" ? "Checking speech access and waiting for microphone permission…"
    : phase==="listening" ? `Listening · ${seconds}s of 20s. Speak one question, then stop.`
    : phase==="preparing" ? "Microphone off. Preparing the article…"
    : phase==="transcribing" ? "Microphone off. Turning your speech into text…"
    : phase==="answering" ? "Microphone off. Checking the article…" : "Speak one question, then tap Stop & answer.";
  return <div className="speech-input">
    <div className="speech-controls">
      <button className="speech-button" type="button" disabled={phase==="idle" && disabled || active && phase!=="listening"} onClick={phase==="listening" ? finish : start}>
        {phase==="listening" ? "Stop & answer" : phase==="requesting" ? "Opening microphone…" : phase==="preparing" ? "Preparing the source…" : phase==="transcribing" ? "Transcribing…" : phase==="answering" ? "Checking the source…" : "Speak a question"}
      </button>
      {active && <button className="cancel-button" type="button" onClick={cancel}>Cancel</button>}
    </div>
    <p className="speech-status" role="status">{status}</p>
    {message && <p className="speech-error" role="alert">{message}</p>}
    <p className="speech-privacy">Your question goes to Deepgram for transcription, then OpenAI for an answer. Cuelo doesn’t save the audio or transcript.</p>
  </div>;
}
