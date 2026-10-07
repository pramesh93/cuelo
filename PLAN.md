# Cuelo plan

This file was missing on 6 October 2026. Reconstructed only from PRODUCT.md and the user's approved milestone.

## Shipped milestone 1

“I can type one evaluation question, and get either a short answer with the exact supporting excerpt from one public help article, or ‘Not verified in this source’.”

Source: https://slack.com/help/articles/203772216-SAML-single-sign-on

- Build a typed evaluation screen, separate from voice onboarding.
- Fetch only this public article on the backend; reject unexpected redirects and oversized sources.
- Generate with GPT-4.1, at most 40 words; return a source section and exact excerpt.
- Check excerpts against the fetched article. Refuse unsupported questions; preserve conditions.
- Check “Do you support SSO on the Pro plan?” preserves the Salesforce condition.
- Check “Can you guarantee a custom integration by Friday?” returns “Not verified in this source”.
- Verify in desktop Chrome and check narrow layout. The user authorised shipping on 6 October 2026.

## Later milestones (not authorised for this build)

Follow PRODUCT.md section 7 after the current human practice: speech and channel separation; session controls and cutoff; speaking avatar, Google sign-in and invited live calls; repeat-use pilot; saved source.

## Confirmed milestone: spoken source evaluation

User explicitly redirected the next milestone on 6 October 2026 and approved the plan before implementation: speak one question into the site's microphone and receive the same sourced answer or “Not verified in this source”.

- Add Speak a question, Stop & answer, Cancel and truthful listening/transcription states; retain typed input.
- Capture at most 20 seconds; send canonical mono 16 kHz PCM audio through Convex to Deepgram Nova-3 English after Stop. No continuous connection or browser provider credential.
- Backend validates exact audio format, byte size (640,044 maximum) and duration before spending. Reserve $0.01 per speech attempt, at most 10 attempts per deployment; failures count, one in-flight transcription and no automatic retry. Existing answer allowance remains unchanged and is checked before transcription.
- Keep DEEPGRAM_API_KEY only in Convex environment variables. SPEECH_TESTING_ENABLED defaults off; activate real testing only after key/credits are available. Production settings remain separate.
- Use mip_opt_out=true on every Deepgram request. Store no audio/transcripts in Cuelo tables, file storage or application logs; provider request metadata remains separate.
- Show recognised text and invoke the existing evaluation.ask action unchanged. No new answering, retrieval or source checks.
- Stop or Cancel releases capture; late results after cancellation must not submit a question or reappear. Leaving the page cancels listening.
- Verify spoken supported/refusal questions with a physical microphone in desktop Chrome; label fake-device/provider tests as simulations. Report Stop-to-answer timings separately from existing backend-answer timing.
- The user confirmed that the microphone flow works in Chrome on 6 October 2026; release is authorised. No user-measured latency or detailed failure-check results were reported.

## Current milestone: use an answer without losing the conversation

The user approved the six-round, 30-minute human-practice plan on 6 October 2026, using the current Slack SAML source and manual Stop & answer. A colleague adds a detail after capture stops and waits before asking the next question; this is not continuous listening.

- Prepare four straightforward supported questions, one absent promise and one conditional claim. Give the answer guide only to the colleague.
- Follow PRACTICE_CHROME.md, PRACTICE_CUSTOMER.md and PRACTICE_CHECKER.md; record only timings and check results in PRACTICE_SCORE.csv, never recordings or answer history.
- Pass requires correct evidence for all supported answers, safe refusal for the promise, preserved Salesforce condition, all six total question-end-to-answer times within five seconds, all six added details recalled, and at least three straightforward answers used.
- Production allowance check: six of ten answer attempts used, leaving four; one of ten speech attempts used, leaving nine. The user declined extra attempts and requested a four-question first pass. Use B, E, A and F, retaining both spending caps and historical usage; no warm-ups or retries. No paid requests were made while preparing the practice.
- The four-round first pass checks two straightforward answers, a refusal and a conditional answer; all four total response times must be within five seconds, all four details recalled and both straightforward answers used. C and D are parked for a later expanded run. Do not claim completion of the original six-round milestone from this first pass.
- Human practice and recorded results remain pending. Preparation does not complete this milestone or prove Google Meet capture.
- Four-round first-pass results received: 8s, 7s, 6s, 4s; only the fourth meets the five-second target. First answer reported correct, second safely refused, third and fourth source excerpts reported. Attention recall and answer use remain pending, as does explicit confirmation of the fourth answer's Salesforce condition. Do not mark the milestone complete.
- Attention recall later confirmed for all four rounds; user attributes it to time available while waiting. Answer use and explicit Salesforce qualification remain unconfirmed. Read-only diagnosis in LATENCY_FINDINGS.md found answer preparation/generation is the larger measured stage; repeated source loading occurs after transcription. User approved loading the source while speaking. Development implementation, 17 tests, compilation and Chrome simulations passed. Live speed is unmeasured; a paid speed retest remains unapproved. Existing answer cap is exhausted and stays unchanged.

## Parked

Uploads, login, Meet listening, speaker separation, avatar and all other later milestones. The scoped microphone question flow above is authorised.

## Shipping gate

Shipping authorised on 6 October 2026. Public repository: https://github.com/pramesh93/cuelo. Production: https://deafening-frog-846.convex.site. Deploy with npm run deploy; git push does not deploy. Paid testing requires explicit activation and a provider key entered directly into Convex.

## Approved speed retest — 6 October 2026

User checked provider limits and explicitly requested proceeding with the test. Authorised four additional production answer attempts: EVALUATION_ATTEMPT_LIMIT=14, preserving the historical count of 10. Speech remains capped at 10, with historical count 6. Four spoken attempts are available, including failures; do not spend these on automated provider checks. Publish the preloaded-source version for testing, then repeat B/E/A/F in desktop Chrome and record actual Stop-to-answer times and evidence results. The performance milestone remains unconfirmed until user results. Commit/push the completed milestone after that confirmation.

Retest evidence: three reported answers at 10/4/6s, beginning with a random refused question rather than the planned script. Prepared-source consumption confirmed in production logs. The five-second target fails for two reported replies; timing method and scripted correctness checks remain incomplete. Production speech count is 10/10, answer count 13/14. Do not spend or raise caps. Propose separate timing for source wait, transcription, request travel and answer stages before more paid testing.

## Proposed next milestone: automatic questions from Google Meet

User explicitly paused performance testing and redirected to automatic Meet listening. Remove Speak a question and Stop & answer from the call flow. One Start listening click remains for Chrome capture permission: select the Meet tab and enable tab audio, with the salesperson microphone captured separately. Question boundaries and question detection run automatically, retaining supported evidence/refusal checks and ignoring salesperson speech as an answer trigger. Keep listening during answer generation; a newer customer question invalidates the obsolete answer. Use the current public Slack source with an explicit document-mode confirmation for this milestone; do not infer mode from saved state.

Background behavior: current SpeechInput cancels on visibilitychange when document.hidden. Remove hidden-page cancellation in the approved call implementation, while preserving immediate Stop, unload/navigation cleanup, revoked-permission/device loss handling and closed-tab errors. Validate switching Chrome tabs/windows and keeping Cuelo open throughout a real Meet call. Hidden-event simulations do not substitute for that physical check.

Prerequisites: Google sign-in with backend invited-tester access before live call capture; secure supported audio route with backend admission/spending checks and bounded sessions. Deepgram temporary token expiry does not end an established stream, so do not treat token TTL as a call/spending cutoff. Resolve enforceable streaming architecture within the fixed Convex stack before enabling paid live capture; no additional service without approval. Retain full temporary current-call text for context, delete at session end and expire abandoned sessions, avoid transcript/audio logs and recordings. Specify server-side context limits consistent with 60-minute calls, reserve call costs, and obtain concrete testing-budget approval before paid tests. Warn at 55 minutes and stop Cuelo capture/transcription/answers at 60 minutes; Meet continues.

Checks: real desktop Chrome Meet customer question, salesperson speech without answer triggers, next question while answering, supported answer and safe refusal, actual window/tab switches, Pause/Resume/Stop, missing tab audio, revoked permission/closed Meet tab and backend cutoff. Use controlled synthetic public/fictional data for automated simulations; label them. Floating card, generic mode UI, uploads and avatar remain parked. Performance improvement is parked and not claimed complete. User approved this plan. Implementation has started; secure audio route resolution is required before live capture.

### Implementation checkpoint and audio decision

Removed visibilitychange cancellation locally. Background hidden-event Chrome simulation passes; explicit Cancel and pagehide release capture; existing 20-second prototype cutoff still applies. Automated second-window check kept capture active, but document.hidden stayed false, so physical Meet/window-switch proof remains pending. All 20 unit tests, frontend build and development Convex push passed.

Prepared Google-only Convex Auth backend, auth tables, root discovery/callback routes and internal tester grants/revocation. Development signing keys are configured securely in Convex; OAuth client ID/secret are absent in both environments. Real Google sign-in has not been tested. No live capture is enabled.

Deepgram documentation confirms temporary token expiry only gates connection establishment, not established-stream duration. Browser-only shutdown cannot enforce backend spending/session cutoffs against a modified client. No documented provider-enforced per-stream duration/spending control was found in the reviewed route. Convex action lifetime is bounded and cannot host a full 60-minute call. Do not issue browser tokens or claim that token TTL provides this cutoff.

User clarification pending: approve short automatic audio batches through Convex (retaining one Start click, automatic question detection, Nova-3 and the fixed stack, but potentially adding delay), or keep continuous streaming and resolve an enforceable route first. This would explicitly revise the continuous-streaming implementation choice, so it is not inferred from prior yes. No additional service is authorised. No paid requests, limit increases, production deployment or milestone completion.

## Approved v1 release plan — 6 October 2026

The user approved prioritising full v1 functionality and approved UI over performance optimisation. This supersedes the historical parked-feature ordering above. The old performance milestone remains incomplete and parked; the OpenAI/Deepgram comparison is also parked. No provider migration, delayed audio batching or extra service is approved.

Build sequentially:
1. Live-call foundation: Google-only account flow, invited access, enforceable continuous-audio architecture and backend spending/session controls. Keep paid live capture disabled until verified.
2. Automatic Meet: separate tab/microphone feeds, question detection, listening during answers, stale-answer cancellation, background-window regression and session Pause/Stop.
3. Sources/modes: PDF, Word, pasted text/public webpage, ownership, size/page limits, replacement/deletion, explicit generic/document provenance and temporary call context/expiry.
4. Approved design: website, original blob, account/source/call setup, floating card, evidence, Hide and fallback; desktop and narrow-layout checks.
5. First experience: five successful opening answers and independent three-question speaking-avatar practice, using real recognised audio and the common answer service.
6. Release: real desktop Chrome/Meet/microphone tests including participant screen-share, errors, permissions, 55/60-minute controls and backend limits; after user confirmation commit, push and npm run deploy.

Plan approval does not reset the exhausted prototype allowances or authorise paid tests. Existing model/evidence protections stay in place. Audio-only relay proposal requested because reviewed Deepgram temporary-token documentation does not provide a backend cutoff for established browser streams. All website hosting/account/data remain Convex. Google credentials must be entered directly in service settings, never chat or committed files.

### V1 foundation implementation checkpoint

The scope file already existed as `Idea_Scope.md` (different capitalisation); preserved its original content and appended the approved release update. Google account UI is available in development at `/?view=account`; added explicitly chosen answer mode and account-owned saved Meet setup, with backend destination validation. No mode is auto-selected from saved settings; a link never marks audio connected.

Shared internal INR reservation ledger implemented, disabled by default: ₹5,000 monthly ceiling, ₹500 reserved headroom, alert at ₹4,000 reserved, atomic shared reservations and idempotent request keys. This is an estimated-cost foundation, not provider billing or a verified production spending cap. Provider routes, calculated per-operation reservations, existing prototype/provider usage reconciliation, and actual alerts must be connected before activation. Prototype counters/settings are unchanged.

All 24 unit tests, build and development Convex push passed. Real signed-out development Chrome check passed missing-configuration state, navigation and desktop/narrow layout without provider calls. Real Google round trip remains blocked by missing AUTH_GOOGLE_ID/SECRET; production signing keys and SITE_URL also absent. GOOGLE_SIGNIN_SETUP.md contains direct-service entry steps. Audio relay decision remains pending; no browser streaming token, provider migration, paid test or production release is enabled.

### Audio relay proposal — 6 October 2026

User approved preparing an audio-only relay proposal. AUDIO_RELAY_PROPOSAL.md recommends one Render Starter service on a Hobby workspace ($7/month published compute rate, shared 5 GB outbound bandwidth and $0.15/GB excess; taxes/currency conversion additional). Convex retains all website hosting/auth/data/answers. Provider keys stay Convex-only; short-lived provider credentials go only to the trusted relay. Proposed initial capacity: one active call, original 60-minute deadline across reconnects, single-use admission, server shutdown, bounded leases/bytes and no audio storage. No service, paid test, credentials or production deployment created. Specific service/cost activation and paid functional-test allowance remain unapproved.

### Local capture safety check — prepared, awaiting real Chrome proof

- Browser capture guards and development-only `?view=capture-check` are implemented; production build excludes the diagnostic.
- 30 tests pass. Generated-media Chrome checks cover simulated source loss, hidden-page continuity, Stop and accelerated cutoff; diagnostic Connect/Pause/Reconnect/Stop releases generated tracks.
- Follow CALL_CAPTURE_CHECK.md to verify actual Meet capture, closing the shared tab, stopping sharing and switching Chrome windows. Meet Leave with its tab still open requires manual Stop in v1.
- These checks do not prove transcription, speaker separation, answers or backend cutoff. Google credentials, secure streaming architecture/service cost approval and paid testing activation remain pending. Performance tuning stays parked.

### Source-management milestone — built in development, awaiting user check

- Paste, PDF, Word .docx and one public https page import; explicit source confirmation, readable-text inspection, replace/delete and optional account saving implemented.
- Backend limits: 10 MB, 50 pages, 200,000 readable characters, 500 passages and 800 KB serialised content. Webpage downloads up to 2 MB/15 seconds/5 hops; DNS addresses checked and pinned on every request/redirect. Word uses its saved page count and passage references; absent count requires PDF. Older .doc and OCR remain unsupported.
- One active source per temporary capability/account; guest capabilities hashed before persistence. Original uploads use one-use 2-minute permissions and a bounded HTTP route, avoiding Node's 5 MiB argument limit. Original files deleted after extraction, with abandoned-upload cleanup. Temporary source expiry is one hour, with indexed cleanup; session-end cleanup will be connected to practice/live lifecycle.
- Account source saving requires Google sign-in and explicit Keep; selecting a source before signup does not save it automatically. Sources/search entries replaced or deleted together; failed/stale imports preserve the existing source.
- Development-only source admission enabled. Operational development guard: 60 import attempts per hour globally, shared across guests/accounts; this does not change AI allowances or reliably identify anonymous people. Production admission remains disabled.
- Chrome instructions: SOURCE_CHECK.md. Real account saving awaits missing Google configuration. Newly managed sources are not yet connected to answer generation or the avatar/live flows. No production deploy or provider calls.

### Source release — confirmed and published

User confirmed source management works. Commit 6d46c35 pushed to the public Cuelo repository; npm run deploy published backend and website to https://deafening-frog-846.convex.site. Guest source setup enabled in production, retaining the global 60-import/hour operational guard. Production Chrome guest flow passed paste/inspect/Word/replacement/private-link rejection/deletion/narrow layout. Google configuration absent and live admission disabled; development capture diagnostic excluded. Provider usage counts unchanged: 13 answers, 10 speech attempts. Account saving, new-source answers and full v1 remain unfinished.

### Selected-source answers — built, real AI check pending

Explicit generic/document choice, confirmed owned source, inspectable stored citations, safe refusal, backend provenance, cancellation and shared existing attempt limits are implemented in development. Paid admission remains disabled; development has three existing attempts remaining, with ₹20 reserved per admitted check. 53 automated tests, frontend build and real Chrome/development-backend disabled-path checks pass; answer-card rendering used labelled simulations. Real GPT-4.1 grounding/refusal/generic checks await testing activation. SELECTED_ANSWER_CHECK.md records Chrome steps and limits. No production release or performance claim; full v1 remains unfinished.

Approved three-attempt real check: safe refusal and labelled generic answer passed in desktop Chrome (1.7s/4.3s typed-to-card). First sourced-answer inspection failed because of a verification-script transport mistake, so sourced correctness remains unverified. Development cap now 10/10; paid testing switched off. Additional real sourced-answer capacity needs approval; no automatic increase or release.

Selected-source answer milestone verified: user requested completion/publication. One additional development attempt (cap 11, no reset, ₹20 estimate) produced a correct conditional sourced answer with exact inspectable passage in desktop Chrome at 4.5 seconds. All 54 tests and build pass; document answer, refusal and labelled generic response now have real development proof. Paid testing switched off with cap exhausted; production paid admission stays disabled. Publish interface/backend, then continue automatic Meet prerequisites. Full v1 remains unfinished.

### UI milestone — user redirected ahead of Google/audio setup; local review pending

User approved implementing DESIGN.md's UI before remaining integration work. Built new opening with original code-based violet blob/welcome card, first-viewport microphone area, scroll-compressing shared navigation, source invitation, below-fold call invitation, delayed bounded position controls/reset and reduced-motion behaviour. Practice source setup connects existing sample/import controls, but Join/voice remain honestly disabled while audio/avatar integration is unfinished. Existing source, answer and account screens share typography/controls; legacy Slack evaluator remains at ?view=evaluation. Real desktop/narrow Chrome checks and source import/inspection passed; all 55 tests/build pass. UI_CHECK.md gives review steps. No provider work, commit, push or deployment; await user review before publication. Google sign-in/secure streaming and full v1 remain unfinished.

UI review revision: user rejected the lavender wash, then approved a charcoal opening inspired by Fluence, original sales-call imagery, clean white answer cards and expressive blob eyes. Implemented and checked in actual desktop/narrow Chrome. Avatar illustration is decorative only; actual practice/voice/Meet integration remains unfinished. Preview awaits user confirmation before publication.

### UI publication — authorised by user

Replaced rejected call illustration with an original staged animated call preview inspired by Cluely; explicit illustrative/prewritten labels, pause/replay and reduced-motion support. Desktop/narrow Chrome passed animation states, navigation, no microphone capture and no page errors; 55 tests pass. User explicitly requested shipping this UI. Publish to existing GitHub/Convex destinations, then verify production. Google sign-in, opening voice, avatar demo and secure live Meet listening remain unfinished; performance work stays parked.

UI publication complete: commit 28a62ca pushed; npm run deploy succeeded. Production Chrome checked the animated preview and existing guest source/answer-mode flow, without paid requests. Remaining v1 integrations stay pending as above.

### Resumed milestone: Google sign-in and account setup

User approved returning to Google sign-in after UI publication. Existing account/mode/source backend and interface are already implemented. Production signing configuration and SITE_URL are now prepared, development keys preserved, and signed-out setup writes verified rejected. Google client ID/secret remain missing in both environments. Next: user creates/configures Google Web client and enters values directly in Convex, then real desktop Chrome sign-in/sign-out, source retention and account-isolation verification. Do not mark complete or enable paid/live sessions before these checks.

Google/account setup checkpoint confirmed by user: real production Google return, generic Meet setup persistence, sign-out/relogin with explicit mode selection, and explicitly kept source persistence all work. Save/publish this checkpoint. Next unfinished foundation: enforceable continuous Deepgram audio route and invited-session controls before automatic Meet answering. Extra audio-service cost/activation remains unapproved; performance/provider comparison stay parked. Real second-account isolation and saved-source deletion remain full-release checks.
