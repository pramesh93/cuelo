import {Topbar} from "./Topbar";
import {useEffect, useState} from "react";
import {useAuthActions} from "@convex-dev/auth/react";
import {useConvexAuth, useMutation, useQuery} from "convex/react";
import {ConvexError} from "convex/values";
import {api} from "../convex/_generated/api";

import {SourceManager} from "./SourceManager";

type Mode = "generic" | "document";

export function Account() {
  const {signIn, signOut} = useAuthActions();
  const {isLoading, isAuthenticated} = useConvexAuth();
  const access = useQuery(api.callAccess.status);
  const saved = useQuery(api.accountSetup.get, isAuthenticated ? {} : "skip");
  const save = useMutation(api.accountSetup.save);
  // Always ask explicitly; a saved document or prior mode never selects the mode.
  const [mode, setMode] = useState<Mode | null>(null);
  const [meetingUrl, setMeetingUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState<"mode" | "source" | "meeting">("mode");
  useEffect(() => {
    if (!isAuthenticated) {setMode(null); setStep("mode"); setMeetingUrl(""); setMessage("");}
  }, [isAuthenticated]);
  async function login() {
    setBusy(true); setError("");
    try {await signIn("google", {redirectTo: "/?view=account"});}
    catch {setError("We couldn’t sign you in. Please try again."); setBusy(false);}
  }
  async function logout() {
    setBusy(true); setError("");
    try {await signOut();}
    catch {setError("We couldn’t sign you out. Please try again.");}
    finally {setBusy(false);}
  }
  async function saveSetup(event: React.FormEvent) {
    event.preventDefault();
    if (!mode) return;
    setBusy(true); setMessage(""); setError("");
    try {
      const result = await save({mode, meetingUrl});
      setMeetingUrl(result.meetingUrl ?? "");
      setMessage("Your call setup is saved. Audio is not connected.");
    } catch (error) {
      setError(error instanceof ConvexError && typeof error.data === "string" ? error.data : "Your setup couldn’t be saved. Check your connection and try again.");
    } finally {setBusy(false);}
  }
  const loading = isLoading || access === undefined;
  return <>
    <Topbar/>
    <main className="account-page">
      <h1>Add Cuelo to your next call.</h1>
      <p className="intro">Short answers in text, while you stay in the conversation.</p>
      {loading ? <p role="status">Checking your account…</p> : !isAuthenticated ? <section className="account-content" aria-label="Google sign-in">
        <p>Sign up or log in to continue.</p>
        <button className="primary google-button" type="button" disabled={busy || !access.googleConfigured} onClick={login}>
          <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M21.6 12.2c0-.7-.1-1.5-.2-2.2H12v4h5.4a4.6 4.6 0 0 1-2 3c-1 .7-2.1 1-3.4 1-3.4 0-6.2-2.8-6.2-6.2S8.6 5.6 12 5.6c1.6 0 3 .6 4.1 1.6l3-3A10.3 10.3 0 0 0 12 1.4 10.6 10.6 0 1 0 12 22.6c6.1 0 9.6-4.2 9.6-10.4Z"/></svg>
          {busy ? "Signing you in…" : "Continue with Google"}
        </button>
        {!access.googleConfigured && <p className="setup-notice" role="status">Google sign-in isn’t available yet. Please come back when setup is complete.</p>}
        <p className="supporting">Anyone can sign up. Live calls are currently available to invited testers.</p>
      </section> : <section className="account-content" aria-label="Call setup">
        <div className="account-session"><p>You’re signed in.</p><button type="button" className="text-button" disabled={busy} onClick={logout}>Sign out</button></div>
        {step === "mode" ? <>
          <h2>How should Cuelo answer?</h2>
          <fieldset className="mode-options"><legend className="sr-only">Choose your answer mode</legend>
            <label className={`mode-option ${mode === "generic" ? "selected" : ""}`}><input type="radio" name="answer-mode" value="generic" checked={mode === "generic"} onChange={() => {setMode("generic"); setMessage("");}}/><span><strong>Generic answers</strong><span>General knowledge. Not from your document.</span></span></label>
            <label className={`mode-option ${mode === "document" ? "selected" : ""}`}><input type="radio" name="answer-mode" value="document" checked={mode === "document"} onChange={() => {setMode("document"); setMessage("");}}/><span><strong>Answers from my document</strong><span>Answers grounded in one source you add.</span></span></label>
          </fieldset>
          <button type="button" className="primary" disabled={!mode || busy} onClick={async () => {
            if (!mode) return;
            setBusy(true); setError("");
            try {await save({mode, meetingUrl: saved?.meetingUrl ?? ""}); setMeetingUrl(saved?.meetingUrl ?? ""); setStep(mode === "document" ? "source" : "meeting");}
            catch {setError("Your choice couldn’t be saved. Please try again.");}
            finally {setBusy(false);}
          }}>{busy ? "Saving your choice…" : "Continue"}</button>
        </> : step === "source" ? <SourceManager savedOnly onConfirmed={() => setStep("meeting")}/> : <>
          <h2>Connect your Google Meet call</h2>
          <p className="mode-summary">{mode === "generic" ? "Generic answers · Not from your document" : "Answers from my document"} <button className="text-button" type="button" onClick={() => {setStep("mode"); setMode(null); setMessage("");}}>Change</button></p>
          {mode === "document" && <p className="setup-notice">Your source was selected. Confirm it again before live listening starts.</p>}
          <form onSubmit={saveSetup}><label htmlFor="meet-link">Google Meet link</label><input id="meet-link" type="url" value={meetingUrl} onChange={event => {setMeetingUrl(event.target.value); setMessage("");}} placeholder="https://meet.google.com/abc-defg-hij" maxLength={256} required/>
            <p className="supporting">A link does not connect audio. You’ll select the Meet tab and enable tab audio separately.</p>
            <button className="primary" disabled={busy || !meetingUrl.trim()}>{busy ? "Saving your setup…" : "Save call setup"}</button>
          </form>
          {!access.invited && <p className="setup-notice">Your account doesn’t have invited live-call access yet.</p>}
          <p className="supporting">Live listening is not enabled yet. No microphone or meeting audio is being captured.</p>
        </>}
      </section>}
      {message && <p className="account-feedback" role="status">{message}</p>}
      {error && <p className="account-feedback error" role="alert">{error}</p>}
      <footer>Built for desktop Chrome. Cuelo replies in text and never speaks during your call.</footer>
    </main>
  </>;
}
