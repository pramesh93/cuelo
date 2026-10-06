// Development-only diagnostic, excluded from the production website.
import {useEffect, useRef, useState} from "react";
import {connectCallCapture, type CallCapture, type CaptureStopReason} from "./callCapture";

const reasonText: Record<CaptureStopReason, string> = {
  user_stop: "Stopped. Both audio feeds are off.",
  paused: "Paused. Both audio feeds are off. Reconnecting uses the original time limit.",
  meeting_disconnected: "Meeting capture disconnected. Both audio feeds are off.",
  microphone_disconnected: "Your microphone disconnected. Both audio feeds are off.",
  connection_lost: "Connection lost. Both audio feeds are off.",
  page_left: "Capture stopped because you left this page.",
  time_limit: "The 60-minute capture limit was reached. Both audio feeds are off. Meet can continue.",
};
export default function CaptureCheck() {
  const capture = useRef<CallCapture | null>(null);
  const abort = useRef<AbortController | null>(null);
  const deadline = useRef<number | null>(null);
  const generation = useRef(0);
  const [busy, setBusy] = useState(false);
  const [connected, setConnected] = useState(false);
  const [paused, setPaused] = useState(false);
  const [message, setMessage] = useState("No meeting audio or microphone is connected.");
  const [error, setError] = useState("");
  const [warning, setWarning] = useState(false);
  useEffect(() => () => {
    generation.current++;
    capture.current?.stop(); capture.current = null;
    abort.current?.abort(); abort.current = null;
  }, []);
  function stop(reason: "user_stop" | "paused" = "user_stop") {
    if (capture.current) capture.current.stop(reason);
    else abort.current?.abort();
  }
  async function connect() {
    const id = ++generation.current;
    const controller = new AbortController(); abort.current = controller;
    if (deadline.current === null) deadline.current = Date.now() + 3600000;
    setBusy(true); setError(""); setWarning(false);
    setMessage("Select the Meet tab and enable tab audio, then allow your microphone.");
    try {
      const result = await connectCallCapture({
        deadlineMs: deadline.current, signal: controller.signal,
        onWarning: () => {if (id === generation.current) setWarning(true);},
        onStopped: reason => {
          if (id !== generation.current) return;
          generation.current++;
          capture.current = null;
          controller.abort(); abort.current = null;
          setBusy(false); setConnected(false); setWarning(false);
          setPaused(reason === "paused");
          setMessage(reasonText[reason]);
          if (reason !== "paused") deadline.current = null;
        },
      });
      if (id !== generation.current) {result.stop(); return;}
      capture.current = result;
      setConnected(true); setPaused(false);
      setMessage("Meeting audio and microphone connected for this capture check. No transcription or answers are running.");
    } catch (error) {
      if (id !== generation.current) return;
      deadline.current = null;
      setConnected(false); setPaused(false);
      setMessage("No meeting audio or microphone is connected.");
      const name = error instanceof Error ? error.name : "";
      setError(name === "NotAllowedError" ? "Capture permission was denied. Try again and select the Meet tab with tab audio enabled."
        : error instanceof Error ? error.message : "Could not connect capture. Check Chrome permissions and try again.");
    } finally {if (id === generation.current) {setBusy(false); abort.current = capture.current ? controller : null;}}
  }
  return <>
    <header><a className="wordmark brand-link" href="/">Cuelo</a><a href="/">Back to Cuelo</a></header>
    <main className="account-page">
      <h1>Check call capture.</h1>
      <p className="intro">Development check only. No Deepgram, OpenAI, transcription, answers or recordings.</p>
      <section className="account-content" aria-label="Capture check">
        <p>Join Meet in another tab. Select that tab and enable tab audio when Chrome asks. Your microphone connects separately.</p>
        <p role="status">{message}</p>
        {warning && <p role="status">The original session limit ends in five minutes or less.</p>}
        {error && <p className="error" role="alert">{error}</p>}
        {!connected && <button type="button" className="primary" disabled={busy} onClick={connect}>{busy ? "Waiting for capture permission…" : paused ? "Reconnect audio" : "Connect call audio"}</button>}
        {(busy || connected) && <div className="speech-controls">
          {connected && <button type="button" className="cancel-button" onClick={() => stop("paused")}>Pause</button>}
          <button type="button" className="cancel-button" onClick={() => stop()}>Stop</button>
        </div>}
        <p className="supporting">Switching windows should keep capture connected. Closing the shared tab or stopping Chrome’s sharing should release both feeds. Leaving Meet while its tab stays open may not stop capture—use Stop.</p>
      </section>
    </main>
  </>;
}
