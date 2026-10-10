# Cuelo native sidebar — development checkpoint, 10 October 2026

This extension uses the separate test backend calculating-gecko-263. Production publication is not authorised by this checkpoint. The website account/source pages remain available, but no persistent Cuelo website controller tab is needed for sidebar calls. Old tabCapture, floating-card and website-bridge experiments are archived under experiments and are not the active extension.

## Load and use

1. Disable the unpaid Cuelo audio-check prototype. Reload **Cuelo — development** from this extension/meet folder at chrome://extensions, then refresh Meet so its content scripts update.
2. Open Cuelo before or after joining Meet in the same Chrome window. The sidebar detects a joined meeting. No repeated target-tab toolbar grant, tab-sharing picker, floating window or extension-origin microphone prompt is part of this path. Meet host access and its existing microphone permission are required.
3. Header must say **Test version**. Google sign-in, account sources and usage belong to development, separate from production. A temporary Google sign-in window is accepted for now; improving its presentation is parked.
4. Explicitly choose generic answers or answers from one document. Generic needs no source; every answer visibly says **Not from your document**. Document mode selects the saved source or imports a new one in the sidebar. Full source inspection/replacement/deletion remains on the website; supporting answer passages open in the sidebar.
5. Before a paid call, read the actual session count, configured capacity and spending balance. Limits can change only with explicit approval. Start consumes a session after successful local audio preflight; Stop followed by Start is a new session. Never reset counters to work around a limit.
6. With headphones and another participant/device, click Start once. Local microphone, audio worklet and frames from both channels are checked before backend admission and provider credentials. Cuelo shows generated answers to customer questions; salesperson speech is context only.
7. Each accepted question is answered in order. Later customer speech never cancels it; repeated questions get fresh requests. Latest answer appears above earlier cards. Pause stops audio and suspends waiting work, retaining cards/context and the original deadline. Resume does not grant a fresh allowance or deadline.
8. At the configured answer limit (currently four), capture/transcription and waiting work stop. The same screen retains completed answers and shows **Four-answer test limit reached. Audio and transcription are off. Your answers remain below.** Pause/Resume is disabled; explicit Stop clears the view. Meet departure/tab closure also stops and clears the call.

## Evidence and errors

Document answers show the actual source title and section/page, followed by an expandable exact supporting passage. Missing evidence says **I couldn't find this in your source.** Never silently fall back to generic answers. Missing/deleted/expired sources require reconfirmation. Temporary provider failures say **Busy right now. Try again in a few minutes.** They stop listening with the reason visible. A safely rejected answer is withheld with a question-specific notice; later queued questions continue within the existing allowance.

## Verified and deferred

User-reported real Chrome checks: customer answers and retained earlier cards, fresh answers for repeats, no triggers from salesperson speech, window switching, Pause/Resume, automatic stopping on Meet departure, and the four-answer limit screen. Sharing the same window exposed Cuelo; sharing another window did not. No guaranteed invisibility or separately verified whole-screen sharing.

Deferred: salesperson speech influencing a later answer, multi-part questions with mixed supported/unsupported evidence, the 55-minute warning/60-minute cutoff test, Google-window presentation, shorter remembered login, performance work and independent stopping enforcement. Physical microphone selection, measured background frame gaps and real service/safety failure recovery remain unverified.

**Check audio continuity** shows frame counts and largest gaps without transcripts. About 20 frames/second/channel are expected; a returning meter alone does not prove uninterrupted background delivery. Muted microphone sends silence. Cuelo uses cloned meeting tracks and closes its own microphone without ending Meet.

## Architecture and checks

Meet-page audio → bounded trusted dual-channel PCM relay → hidden authenticated extension document → short-lived Deepgram credentials and existing Convex question/answer functions. No long-lived provider key in the browser, recording, persistent audio queue or past-call history. Caller/source ownership, invitations, spending and allowances remain backend-enforced. Stop deletes temporary call text and guest evidence; abandoned calls expire and scheduled cleanup removes them.

The approved restricted v1 uses page-controlled shutdown: backend admission does not independently close established provider streams if the browser freezes or is modified. Never describe token expiry or browser timers as independent stopping enforcement.

Build: npm run build:extension. Defaults to development and does not publish backend/website. Tests: npm test. On 10 October, 132 unpaid automated checks passed; website and extension build results are recorded in SIDEBAR_CHECKPOINT_REVIEW.md. Answer rendering/evidence also checked in real Chrome with simulated results, not real audio/model quality. Backend production publication and extension production build require separate approval.
