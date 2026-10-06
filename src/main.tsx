import React, {useRef, useState} from "react";
import {createRoot} from "react-dom/client";
import {ConvexHttpClient} from "convex/browser";
import {api} from "../convex/_generated/api";
import type {FunctionReturnType} from "convex/server";
import "@fontsource/nunito-sans/400.css";
import "@fontsource/nunito-sans/600.css";
import "@fontsource/nunito-sans/700.css";
import "./style.css";
import {SpeechInput} from "./SpeechInput";

const sourceUrl = "https://slack.com/help/articles/203772216-SAML-single-sign-on";
const url = import.meta.env.VITE_CONVEX_URL;
const client = url ? new ConvexHttpClient(url) : null;
function App() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<FunctionReturnType<typeof api.evaluation.ask> | null>(null);
  const [busy, setBusy] = useState(false);
  const [submittedQuestion, setSubmittedQuestion] = useState("");
  const [voiceActive,setVoiceActive]=useState(false);
  const [voiceElapsed,setVoiceElapsed]=useState<number | null>(null);
  const requestId = useRef(0);
  const field = useRef<HTMLTextAreaElement>(null);
  function change(value: string) {
    requestId.current++;
    setQuestion(value); setResult(null); setBusy(false);setVoiceElapsed(null);
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await answerQuestion(question.trim());
  }
  async function answerQuestion(text:string,stoppedAt?:number) {
    const id = ++requestId.current;
    setBusy(true); setResult(null); setSubmittedQuestion(text);setVoiceElapsed(null);
    try {
      const answer = await client!.action(api.evaluation.ask, {question:text});
      if (id === requestId.current) {setResult(answer);if(stoppedAt!==undefined && answer.status!=="error") setVoiceElapsed(performance.now()-stoppedAt);}
    } catch {
      if (id === requestId.current) setResult({status: "error", answer: "Could not reach Cuelo. Check your connection and try again.", excerpt: null, section: null, sourceTitle: "", sourceUrl: "", elapsedMs: 0});
    } finally { if (id === requestId.current) setBusy(false); }
  }
  return <>
    <header><span className="wordmark">Cuelo</span><span>Source evaluation</span></header>
    <main>
      <h1>An answer you can check.</h1>
      <p className="intro">Speak or type one question about Slack’s SAML single sign-on. Cuelo uses only this article and shows the evidence beside its answer.</p>
      <p className="source-line">One source: <a href={sourceUrl} target="_blank" rel="noreferrer">Set up SAML single sign-on for Slack</a></p>
      <div className="workspace">
        <section aria-labelledby="question-heading">
          <h2 id="question-heading">Your question</h2>
          <SpeechInput client={client!} disabled={busy}
            onBegin={()=>{requestId.current++;setResult(null);setBusy(false);setVoiceElapsed(null);}}
            onQuestion={async(text,stoppedAt)=>{setQuestion(text);await answerQuestion(text,stoppedAt);}}
            onCancel={()=>{requestId.current++;setBusy(false);setResult(null);setVoiceElapsed(null);}}
            onActive={setVoiceActive}/>
          <form onSubmit={submit}>
            <label htmlFor="question">Or type a product evaluation question</label>
            <textarea id="question" ref={field} value={question} disabled={voiceActive} onChange={e=>change(e.target.value)} maxLength={1000} placeholder="Do you support SSO on the Pro plan?" required rows={4}/>
            <button className="primary" type="submit" disabled={busy || voiceActive || !question.trim()}>{busy ? "Checking the article…" : "Check the source"}</button>
          </form>
          <div className="examples"><p>Try the two milestone checks</p>
            {["Do you support SSO on the Pro plan?", "Can you guarantee a custom integration by Friday?"].map(q=><button key={q} type="button" disabled={voiceActive} onClick={()=>{change(q);field.current?.focus();}}>{q}</button>)}
          </div>
        </section>
        <section className="answer-panel" aria-labelledby="answer-heading" aria-live="polite" aria-busy={busy}>
          <h2 id="answer-heading">Answer & evidence</h2>
          {busy ? <p>Reading the article and checking your question…</p> : result ? <>
            <p className="asked">{submittedQuestion}</p>
            {result.status === "verified" ? <><ul className="answer"><li>{result.answer.replace(/^[•\-]\s*/, "")}</li></ul><h3>Exact supporting excerpt</h3><blockquote>{result.excerpt}</blockquote><p className="citation">{result.section}<br/><a href={result.sourceUrl} target="_blank" rel="noreferrer">{result.sourceTitle}</a></p></> : <p className={result.status === "error" ? "error" : "refusal"} role={result.status === "error" ? "alert" : undefined}>{result.answer}</p>}
            {result.status === "unverified" && <p>The article doesn’t verify this claim. Check with the product team before making a promise.</p>}
            {result.status !== "error" && <p className="timing">Measured response: {(result.elapsedMs/1000).toFixed(1)} seconds</p>}
            {voiceElapsed!==null && <p className="timing">Stop to answer: {(voiceElapsed/1000).toFixed(1)} seconds, including transcription.</p>}
          </> : <div className="empty"><p>A short answer. The exact passage.</p><p>If the article can’t support it, you’ll see “Not verified in this source”.</p></div>}
        </section>
      </div>
      <footer>Source evaluation with microphone input. Meet listening and sign-in come later.</footer>
    </main>
  </>;
}
createRoot(document.getElementById("root")!).render(url ? <React.StrictMode><App/></React.StrictMode> : <main><h1>Connect the development backend</h1><p>Set CONVEX_URL in .env.local, then restart the app.</p></main>);
