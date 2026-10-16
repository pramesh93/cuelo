## Current implementation — 16 October 2026

Read [CURRENT_STATE.md](../../CURRENT_STATE.md) for the current approved behavior, test evidence, exhausted development allowance and release blockers. It supersedes conflicting older implementation notes below; unchanged policies and approval requirements still apply. This is a development GitHub checkpoint, not authorization to deploy, publish or enable further paid testing.

## Standing privacy review reminder — 13 October 2026

Whenever Cuelo’s product changes, review whether the privacy policy needs updating. Before every future Chrome extension publication or update, review the policy and Chrome Web Store data/permission disclosures against the actual release, including changes to features, collected data, uses, sharing, permissions, storage, retention, deletion and account/payment handling. Update affected disclosures before publishing; do not add unnecessary technology details. Record what changed, or that no privacy update is needed, in the release review. This review does not itself authorise publishing or deployment.

# Account trial update — 13 October 2026

Invitations are no longer required. Google sign-in is required before listening. Each account gets three successful listening calls or 90 active listening minutes, whichever ends first. Failed starts do not use a trial call. Pause and reconnect retain the session; Pause excludes listening time. Backend counts, ownership and spending safeguards apply. The current development live switch remains off; real provider testing still needs approval and budget capacity. The old global testing guards (including configured answer limits) remain independent of the account trial, and have not been raised/reset. Existing historical calls do not consume new trial credits.

The Chrome Web Store listing is published and linked from the website chooser; Windows/Mac options remain disabled. The published package is older than this development checkpoint. This development build is not a public store release or a production deployment.

# Cuelo native sidebar — development checkpoint, 10 October 2026

This extension uses the separate test backend calculating-gecko-263. Production publication is not authorised by this checkpoint. The website account/source pages remain available, but no persistent Cuelo website controller tab is needed for sidebar calls. Old floating-card and website-controlled audio experiments are archived. Current tabCapture is implemented in extension/src/tabAudio.ts and is part of the active development extension.

## Load and use

1. Disable the unpaid Cuelo audio-check prototype. Reload **Cuelo — development** from this extension/meet folder at chrome://extensions, then refresh Meet so its content scripts update.
2. Open Cuelo before or after joining Meet in the same Chrome window. The sidebar detects a joined meeting. Chrome may require clicking the extension icon on the target Meet tab to grant capture. No tab-sharing picker, floating window or extension-origin microphone prompt is part of this path. Meet host access and its existing microphone permission are required.
3. The extension is named **Cuelo — development**. Google sign-in, account sources and usage belong to development, separate from production. A temporary Google sign-in window is accepted for now; improving its presentation is parked.
4. Explicitly choose generic answers or multiple owned saved sources. Generic needs no source; every answer visibly says **Not from your document**. Document mode uses the searchable multi-select picker. Manage content opens the website. Source-name links open the exact saved source there; only short pasted-text evidence expands inside the sidebar.
5. Before a paid call, read the actual session count, configured capacity and spending balance. Limits can change only with explicit approval. Start consumes a session after successful local audio preflight; Stop followed by Start is a new session. Never reset counters to work around a limit.
6. With headphones and another participant/device, click Start once. Direct Meet-tab capture, a separate Meet-page microphone and audio processing are checked before backend admission and provider credentials. Cuelo shows generated answers to customer questions; salesperson speech is context only.
7. Each accepted question is answered in order. Later customer speech never cancels it; repeated questions get fresh requests. Latest answer appears above earlier cards. Pause stops audio and suspends waiting work, retaining cards/context. Paused time is excluded from the account trial; Resume/reconnect stays within the same call and the original 60-minute session maximum.
8. At the configured answer limit (currently four), capture/transcription and waiting work stop. The same screen retains completed answers and shows **Four-answer test limit reached. Audio and transcription are off. Your answers remain below.** Pause/Resume is disabled; explicit Stop clears the view. Meet departure/tab closure also stops and clears the call.

## Evidence and errors

Document answers show the actual source title and section/page, followed by an expandable exact supporting passage. Missing evidence says **I couldn't find this in your source.** Never silently fall back to generic answers. Missing/deleted/expired sources require reconfirmation. Temporary provider failures say **Busy right now. Try again in a few minutes.** They stop listening with the reason visible. A safely rejected answer is withheld with a question-specific notice; later queued questions continue within the existing allowance.

## Verified and deferred

User-reported real Chrome checks: customer answers and retained earlier cards, fresh answers for repeats, no triggers from salesperson speech, window switching, Pause/Resume, automatic stopping on Meet departure, and the four-answer limit screen. Sharing the same window exposed Cuelo; sharing another window did not. No guaranteed invisibility or separately verified whole-screen sharing.

Deferred: salesperson speech influencing a later answer, multi-part questions with mixed supported/unsupported evidence, the 55-minute warning/60-minute cutoff test, Google-window presentation, shorter remembered login, performance work and independent stopping enforcement. Physical microphone selection, measured background frame gaps and real service/safety failure recovery remain unverified.

**Check audio continuity** shows frame counts and largest gaps without transcripts. About 20 frames/second/channel are expected; a returning meter alone does not prove uninterrupted background delivery. Muted microphone sends silence. Cuelo uses cloned meeting tracks and closes its own microphone without ending Meet.

## Architecture and checks

Meet-page audio → bounded trusted dual-channel PCM relay → hidden authenticated extension document → short-lived Deepgram credentials and existing Convex question/answer functions. No long-lived provider key in the browser, recording, persistent audio queue or past-call history. Caller/source ownership, account trial limits, spending and allowances remain backend-enforced. Stop deletes temporary call text and guest evidence; abandoned calls expire and scheduled cleanup removes them.

The approved restricted v1 uses page-controlled shutdown: backend admission does not independently close established provider streams if the browser freezes or is modified. Never describe token expiry or browser timers as independent stopping enforcement.

Build: npm run build:extension. Defaults to development and does not publish backend/website. Tests: npm test. On 10 October, 132 unpaid automated checks passed; website and extension build results are recorded in SIDEBAR_CHECKPOINT_REVIEW.md. Answer rendering/evidence also checked in real Chrome with simulated results, not real audio/model quality. Backend production publication and extension production build require separate approval.

### Automatic website connection — development change, 14 October 2026

Installation/update attaches website-auth-bridge.js to already-open allowed website tabs using scripting permission and existing host permissions. The production build connects only to production; development connects to the dev website and 127.0.0.1:5173. No Meet injection is added by this handler. Repeated attachment is safe. Onboarding checks automatically on page return and every three seconds while visible; a new connection also rechecks shared sign-in. Reload the unpacked extension once after a developer build to activate new worker/manifest files. Store publication is separate: review the new scripting justification and privacy disclosures before an approved update.

Re-enable fix (14 October 2026): worker startup also attaches the idempotent website bridge to already-open allowed Cuelo tabs; installation events alone do not cover re-enabling. No additional permissions or hosts. After reloading the updated development extension once, test off/on with Home open, without refreshing the website.

## Approved extension design and typing — 14 October 2026

Development sidebar uses the website's light lavender glass theme, local Nunito Sans fonts, branded blinking/breathing CSS blob, Google Sign in, and an account menu with Sign out. Sign out remains available during a call and stops capture first. Active call answers appear above a fixed compact composer with Listening/Answering/Paused status, Pause/Resume, Stop, and a typed-question field/send action. Earlier answers remain expandable; generic answers retain visible provenance and document answers open evidence. Reduced motion disables animation. Source import and original audio/session controls remain functional.

Typed questions are explicit user submissions during a successfully connected listening session only. They join the same ordered queue and temporary call context as spoken questions, use the session's chosen mode/source, share answer/question capacity and trial/session/spending controls, and are deleted with call text. They do not run paid question classification but count against session question capacity. Pause disables typing; Resume restores it. Stop and sign out clear unsent draft text. Backend ownership, live-enabled flag, generation, active listening, input capacity and limits are enforced; browser controls alone do not authorize a request. Production four-answer limit remains disabled; development test limits remain. No additional service/host permission, recording, transcript retention, paid activation or Store update is authorized.

Verification: 191 tests and development builds; actual Chrome UI simulations with fictional data. Reload the unpacked extension once and reopen the side panel. Real Google sign-in, audio and typed AI answer acceptance remain pending separate live-testing approval. Prepared/published Store package is unchanged.

## Approved source selection and unified branding — 14 October 2026

This supersedes the older one-source-per-call restriction for extension calls. The panel uses a searchable multi-select dropdown with a closed selected-count, tick-mark options, Selected only review/removal and Done. Keep selections compact; no checkbox row clutter or outside tags. Up to 20 owned saved sources and 1,000,000 combined text characters per call are the explicit server input bounds; excessive selections are refused clearly rather than truncated. Reject empty, duplicate, excessive, missing, expired or foreign selections before spending admission. Legacy single-source API callers remain supported. Generic mode accepts no source selection. Sources are frozen for the active/paused session; each selected source is protected from website replacement/deletion, including secondary and legacy sources. Stop/expiry removes selection links and temporary text; saved content remains.

Document answers retrieve across selected sources with unique passage IDs and server-supplied document identity, retain 40-word/evidence/input limits, label each supported bullet with its actual source/reference and open the exact supporting passages. Conflicts are reported rather than silently choosing a source or falling back to generic answers. Both spoken and typed requests share this path. Multi-source quality is not established by simulated tests alone.

All content management stays on the website: panel Manage content opens the correct environment's Content page in a new tab; no embedded SourceManager remains in the panel. Source subscriptions update as saved content changes. One shared CueloWordmark and brand.css provide identical Nunito Sans font, size, weight, spacing and geometric round purple dot across landing, sign-in, Home, onboarding and extension. Development manifest now reuses approved blob icons. Chrome controls its outer grey header/close button; do not promise to recolour browser-owned UI. Retain the development label; published name is Cuelo. Development work only; no production/Store release or paid activation is authorized.

15 October 2026 — Approved development participant-audio repair: user Console inspection during an active Meet found no audio/video elements in main document or accessible shadow roots; the sole iframe was inaccessible. This establishes the current page lookup cannot capture participant audio, not why the historical call differed. Worker now obtains a target-bound Chrome tabCapture stream ID after engine readiness; call.html consumes it and processes actual tab audio locally, restoring playback to OS output (OS speaker mute remains effective). Removed dummy customer silence/media-element lookup from the live adapter; Meet-page microphone remains separate and gated by Meet mute/unknown state. Added development tabCapture/activeTab permissions; capture denial explains clicking extension icon on Meet before retry. Tab permission/process checks happen before backend admission. Abort, Pause, Stop, tab track end and failed preparation release streams/context; no recording/new retention. Published Store folder and production unchanged; listening remains off, no extra trial/global allowance or budget reset. Real muted-speaker Meet/audio-answer acceptance remains pending; automated tests use simulated Chrome/audio and UI fixture. Future Store release requires reviewing permission justifications and privacy policy.
