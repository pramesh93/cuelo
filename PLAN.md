# Cuelo plan

## Current sidebar checkpoint — 10 October 2026

Shared website/sidebar sign-in change approved for commit and GitHub push on 10 October 2026; deployment is not authorised. User confirmed real Google sign-in/sign-out in both directions and remembered login after restarting Chrome. Website call setup now gives sidebar instructions. Sign-in before Meet is implemented with a passing regression; that updated screen still needs explicit Chrome confirmation. All 142 automated tests, website/four extension builds and simulated Chrome message checks pass. Active-call logout/account switching remains unverified. Production, provider secrets, paid limits and deployment settings are unchanged. See SHARED_SIGNIN_CHECK.md.

Current live path is the native sidebar with Meet-page audio, separate customer/salesperson channels, independent ordered questions, retained cards and a same-screen test-limit state. The website-controller, floating-card/tabCapture and newer-question cancellation steps below are historical and superseded; do not implement them again. Current instructions: extension/meet/README.md. Checkpoint review and unpaid proof: SIDEBAR_CHECKPOINT_REVIEW.md. Commit/push require explicit approval; production deployment is a separate action. User-deferred tests remain in Parked.

Checkpoint preparation and unpaid sidebar checks completed: 132 tests, website/extension builds and simulated answer-card checks in real Chrome pass. Generic/replay provenance, exact evidence, distinct missing-source/provider failures, backend source ownership and Stop/expiry cleanup are covered without paid requests. Real provider-failure recovery and observed cloud deletion are not claimed. Before production review the older Account-linked website live setup route, which still exposes the superseded picker/floating-card interface. Commit/push approval is pending; nothing has been deployed by this review.


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

- Deferred real Chrome 60-minute cutoff test — user parked this check on 10 October 2026. Later verify the 55-minute warning and stopping Cuelo's capture, transcription and answers at the original 60-minute deadline, including across Pause/Resume, while Meet continues. Current page-controlled enforcement limitations still apply; real cutoff behavior remains unverified. No call-duration setting is changed by deferring the test.

- Deferred live-call context test — 10 October 2026: verify that the salesperson's speech helps Cuelo interpret a later customer question using only the current call's temporary context. User confirmed their own speech did not trigger an answer; context use remains unverified and is explicitly deferred. Do not treat the non-trigger check as proof that context influences answers.

- Multi-part document questions — requested 10 October 2026, for later implementation. Answer each requested capability from the source independently; a missing answer for one part must not suppress supported answers for other parts. User-reported example: “Is SAP integration available in any of the plans? And what about Salesforce and SSO?” currently receives only “I couldn't find this in your source.” Given the supplied passage “The Business plan costs $59 per user per month and includes email support, live chat and Salesforce integration,” the answer must identify Salesforce integration in Business and cite its evidence. If SAP or SSO are unsupported by the selected source, state that separately without claiming they are unavailable. Preserve the short answer format and evidence requirements. Later verification must cover mixed supported/unsupported parts and ensure no requested part silently disappears. This is a recorded requirement and user-reported failure, not an investigated cause or implemented fix.

- Resolve Google sign-in window presentation later: user observed a separate Chrome window rather than the expected small pop-up. User explicitly parked this issue and authorised proceeding with sidebar sources/listening. No new persistent Cuelo tab is approved.

- Shorten the sign-in duration after v1: user accepts 30 days for now. Agree the shorter duration before changing authentication settings; check remembered login, expiry and active-call behaviour. This task does not change the current configuration.

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

Audio option evaluation: local Cloudflare feasibility checks pass; preserve full limitations in AUDIO_RELAY_VERIFICATION.md. Next required step is free Cloudflare account access and hosted one-hour probe before selecting provider or enabling paid live listening. Local accelerated tests do not complete automatic Meet milestone.

Koyeb candidate local evaluation now passes the shared 12 rules plus actual Chrome frozen-page independent-stop check. Hosted Koyeb access and one-hour probe are required before choosing/claiming service suitability. Cloudflare remains an alternative; neither provider has hosted proof.

### User-approved v1 simplification — 7 October 2026

User explicitly deferred extra-service selection, hosted relay testing and independent stopping enforcement, parking them with performance testing/provider comparison. Proceed with page-controlled Stop and automatic stopping in v1; this supersedes the previous relay prerequisite for this restricted version. No Render, Cloudflare or Koyeb activation. This knowingly weakens the independent cutoff/access/spending guarantees: a frozen or modified webpage may not close an established provider connection, and backend admission prevents new calls rather than guaranteeing termination of an existing stream. Never describe browser timers or token expiry as a server-enforced cutoff.

Proposed next implementation: signed-in invited tester starts capture once, explicitly confirms answer mode/source, selects Meet tab audio and separate microphone; continuous Deepgram connection uses only short-lived credentials issued after backend access/spending checks, never the long-lived key. Stop/Pause close capture and speech connections and cancel pending answers; ordinary disconnect/lost permission/page exit and 60-minute page timer invoke the same stopping action, with a 55-minute warning. Keep listening during answers; only customer audio can trigger answers, microphone speech adds temporary current-call context. Window switching must not stop listening. Reuse existing selected-mode answer/evidence service; clear temporary context on end. Meet Leave with the tab still open may require manual Stop.

Implementation plan approval and a separate bounded real-provider test allowance remain pending; no paid flags/counters changed. First verify with simulated speech and Chrome capture, then real Meet/Deepgram when authorised. Full v1 release still needs actual Chrome/Meet checks and honest limitations.

7 October implementation update: user approved the page-controlled plan and requested continuation. Development now contains invited, explicitly selected-mode live sessions; short-lived Deepgram grants; separate customer/microphone PCM streams; backend question detection using the shared existing answer generator and evidence policy; cancellation; Stop/Pause/disconnect/page timer controls; temporary context cleanup and a Document Picture-in-Picture card. All 65 tests and build pass. Actual Chrome generated-audio/simulated-provider checks pass, including Stop closing both sockets/tracks. LIVE_CALL_CHECK.md distinguishes these checks from outstanding real Meet/Deepgram, floating-card, speaker separation, retention and screen-share checks. Paid admission remains off, old allowances unchanged; no production publication. A bounded real-provider testing allowance is the next prerequisite, not another audio-service decision.

Real-test preparation approved by user: configured development-only capacity for one call, four generated answers, twenty detection checks, two connection grants and ₹500 reserved on admission; counters were not reset. Copied the existing Google OAuth configuration securely into development and requested the development callback addition in Google Cloud. Development currently has no signed-in account to invite. Deepgram grant probe returned HTTP 403 FORBIDDEN / insufficient permissions twice; stop probing and require a development Member-permission key entered directly in Convex before activation. Both live and global paid flags are off pending that repair. No real transcription/answer calls or production changes. LIVE_CALL_TEST_QUESTIONS.md contains four questions, made-up source, expected results and checked provider-retention rules.

8 October user redirected work: research and feasibility only for automatic Meet detection and no repeated tab-sharing picker; pause current website call/control changes. Isolated extension prototype and EXTENSION_FEASIBILITY_REPORT.md created, with no product/backend/provider changes. Eight simulated permission-orchestration/resource checks and 65 existing tests pass. Actual Chrome launch blocked in current restricted session; real Meet/audio/permissions unverified. Official Chrome rules require explicit extension invocation for capture and user gesture for the current always-on-top card. Proposed extension flow is conditional on unpaid real Chrome prototype checks, not approved for full implementation. Earlier no-answer failure remains unexplained.

8 October revised extension feasibility approved: build only an unpaid prototype of toolbar → native vertical side panel → sample source choice → one Start → local audio meter in same panel. No overlay/floating/preparation steps. Separate experiments/meet-sidepanel is ready with simulated Chrome/DOM checks; all 65 existing tests pass. Await real user Chrome verification before approving full account/source/Deepgram/answer integration. Product/backend/provider settings unchanged.

8 Oct: Checked user-controlled sidebar sequences without imposing one order. Added simulated regressions for switching tabs before a stale Start click and leaving during pending stream issuance; both failed before fixes and pass afterward. Startup now verifies visible target and joined-call state, cancels on departure/Stop/tab closure, and discards stale capture binding after Chrome permission denial. Sidebar clears prior action error when permission becomes available while retaining source selection. Six simulated probe checks and all 65 product tests pass; real Chrome/audio verification remains pending because browser execution is unavailable in this session. No provider, budget, backend or deployment changes.

8 Oct: User revised the sidebar display: a detected but uninvoked Meet must show the toolbar-click message only; source and Start appear after invocation on that Meet tab. Reproduced previous premature source visibility in a failing simulated check, then gated setup visibility on joined meeting plus toolbar binding (active capture remains visible). Source persistence retained. Simulated checks pass; real Chrome verification pending. No provider/backend/deployment changes.

## Approved sidebar integration — 8 October 2026

User approved moving from the unpaid feasibility prototype to real sidebar answers. This explicitly revises the earlier website-only/no-extension v1 boundary: Chrome extension captures the toolbar-authorised Meet tab; Cuelo website remains the Convex-authenticated session owner. No desktop app or added hosting/service is introduced. Preserve user-controlled opening/joining/tab-switching sequences; outside a joined and invoked Meet, show instructions, with source/Start hidden.

Implementation in extension/meet and src/ExtensionCall.tsx connects one saved account source or explicitly chosen generic mode, local tab PCM, separate salesperson microphone, existing Deepgram Nova-3 transport, and unchanged liveAnswers answer functions. Start combines admission and connection; Pause/Resume retains original deadline/context, Stop and Meet departure close audio/speech and clear server context. Website Stop is retained. Only public origin/source preference identifiers are persisted by the extension; provider/auth credentials remain on the website/backend.

Remaining milestone proof: load the NEW development extension, verify Google sign-in and saved-source retrieval, supported answer/refusal, customer-vs-salesperson speech, new-question cancellation, physical window switches, Pause/Resume/Stop, Meet-end stopping, participant screen sharing and original cutoff in desktop Chrome. Automated simulations cannot complete this milestone. Keep current allowances/budget; no resetting used sessions or enabling paid flags without authorisation. Independent relay and performance improvements remain parked. Do not deploy before real-flow confirmation.

## Required sidebar-only flow — user correction, 8 October 2026

Hard requirement: start/join Google Meet → open Cuelo extension → sign in from the same sidebar if needed → choose the existing saved source OR add a new source to use → click Start in the same sidebar → audio, answers and controls remain there. No new Cuelo tab may be required, opened automatically, or kept open in the background. The previously implemented website-controller-tab architecture was rejected by the user and must not be presented as satisfying this requirement. Verify Google OAuth UI restrictions before choosing the replacement architecture; do not assume an external login popup is approved. Source creation as well as selection must be available in the sidebar. No new service, budget change, or production deployment is authorised by this correction.

## Sidebar sign-in-only check — 8 October 2026

User approved checking the temporary Google window and remembered login before rebuilding call capture. Current extension/meet manifest now loads a bundled native extension sidebar with Convex Auth and an auth-only worker, superseding and disabling the rejected website-controller-tab manifest. Google redirect is intercepted before the SDK can navigate the sidebar: open an explicit Chrome popup, accept only the matching return in that popup with per-attempt state, exchange the one-use code with the original Convex verifier, then let Convex Auth store/renew its session in trusted extension storage. Uses existing Google backend callback/SITE_URL; no separate persistent tab, auth service, environment change or paid call.

Chrome proof still needed: popup rather than main-window tab; backend confirms signed-in identity in sidebar; reopening sidebar and restarting Chrome remember login; cancellation/sign-out behave honestly. Sign-in settings remain unchanged (default 30 days, deployment overrides unverified); shortening is parked. Source add/select and listening are not enabled in this narrow check. On confirmation, integrate those directly in the sidebar/offscreen extension and keep answer functions unchanged. Build with npm run build:extension. Retired tab-controller implementation is retained only under experiments/retired-website-bridge and its dropped-flow tests removed from the active suite.

## Native sidebar continuation — 8 October 2026

User observed Google sign-in opening a separate Chrome window and explicitly asked to park its presentation fix and continue. This observation does not confirm completed login or persistent identity. Resolve the sign-in window presentation later; shorten the accepted 30-day login later as already requested.

Sources, mode, Start, audio and answer cards now live in the native sidebar. The hidden extension document holds the live session; it replaces the retired Cuelo website-controller tab. The extension uses the established Convex Auth and unchanged liveCalls/liveSpeech/liveAnswers functions. No new service, production publication, paid setting, allowance reset or budget increase. Upload CORS now accepts Chrome-assigned extension origins but still requires a backend-issued single-use grant; this change awaits development backend publication under current network restrictions.

Local checks: 83 simulated/backend unit tests, website build and both extension bundles pass. Actual Google identity/login persistence, real microphone permission, customer/source answers, salesperson non-triggering, background switches, Pause/Resume/Stop, Meet departure, file uploads and cutoff remain unverified in Chrome. Follow extension/meet/README.md with current allowances. Do not mark the milestone complete or publish production based on simulations.


8 Oct saved-source bug: user confirmed the missing source was saved on the live website. Root cause: the extension inherited the local development Convex URL, creating separate auth/source storage. Rebuilt the sidebar and hidden call document to use production by default, with production Google return and namespaced login; development now requires explicit selection. Source setup uses the already-published callAccess status and remains visible when paid listening is disabled; Start still requires invited/enabled access. No source copying/deletion, account-access bypass, provider requests, paid flags, counters, budget settings or deployment changes. Both environment regression checks fail before the fix and pass afterward; all 85 automated tests and extension build pass. Actual Chrome sign-in and saved-source visibility await verification; production live-call activation/backend publication remains separate and pending.


8 Oct: User confirmed Admin resources is visible from the live account and requested the real-call Chrome test next. The source-connection fix is user-verified; listening is not. Attempt to read production LIVE_CALL_TESTING_ENABLED failed (fetch/DNS), so production activation, invitations, combined development/production reservations and remaining live capacity could not be checked or changed. No provider or deployment action occurred. LIVE_SIDEBAR_CHROME_CHECK.md provides a no-spend Start-status check followed by four source-based participant questions and Pause/Resume/window-switch/Meet-end checks once the same live account is ready. Expected source facts checked against the current public Slack page; user-saved evidence still controls answers.


8 Oct production tester access: user reports the sidebar's backend-backed status says their live account is not invited. Prior invitation was granted only in development. Tried the production public status endpoint to establish connectivity; request failed with DNS ENOTFOUND. No access grant, paid flag, source change or deployment was made. Required next action: dashboard administrator runs existing internal callAccess:setTesterAccess for the user's own production users._id with enabled=true; preserve invited-only enforcement and then inspect the new sidebar status.


8 Oct invitation still denied after the user attempted a dashboard grant. Actual cause remains unconfirmed because live records are inaccessible; do not assume the grant used the correct account/deployment or claim invitation repaired. Added sidebar Troubleshoot tester access: show only the current account ID from an unexpired credential for the configured issuer (diagnostic only), identify the selected deployment, and perform a new authenticated HTTP callAccess.status query instead of depending on the existing subscription. No credentials/session IDs are rendered or logged; backend invitation enforcement unchanged. 87 automated tests and both extension bundles pass. Next Chrome check: reload, check access again, and compare sidebar account ID to the production invitation userId. No production changes or paid calls.


8 Oct user explicitly chose separate testing, superseding the production-sidebar test continuation. Rebuilt extension against development calculating-gecko-263; it is again the default, including sign-in/return, source storage, token namespace and hidden capture document. Sidebar visibly labels Test version. Production data/invitations/settings were not changed or revoked; no deployment/provider call, allowance reset or paid activation. User should import the public Admin resources URL into this separate test account, then use only development account diagnostics if access is missing. Environment regression fails before the change and passes afterward; all 87 automated tests and both extension bundles pass. Actual Chrome source/call flow, remaining capacity and flags remain unverified because remote access is unavailable.


8 Oct: User confirmed development Start is enabled, then reported Permission dismissed after attempting Start. Failure can occur at microphone capture before provider admission; actual prompt visibility remains unconfirmed. Chromium's own extension-team discussions document suppressed side-panel microphone prompts and a temporary popup workaround; that workaround changes the user's approved sidebar-only flow and has NOT been added. Asked whether a permission prompt appeared. Improved the sidebar microphone error wording without blaming the user, preserved late-cancellation cleanup and pre-permission provider blocking. 90 simulated/unit tests and extension bundles pass; real Chrome microphone grant/listening remains unresolved. No popup/tab, provider, budget, counter or production change. Sources: https://groups.google.com/a/chromium.org/g/chromium-extensions/c/V09VMCLzvWM and https://groups.google.com/a/chromium.org/g/chromium-extensions/c/cJmdMLmpbjg/m/QhdfxQ1VAAAJ.


8 Oct microphone permission: user confirms no Chrome permission prompt appeared. This matches the documented side-panel first-grant limitation and the current direct-sidebar getUserMedia request. Proposed minimal recovery for approval: when permission is not granted, Start opens one temporary extension permission popup; user explicitly allows microphone; popup immediately releases its probe stream and closes, then the same Start continues in the sidebar. Later calls reuse the grant where Chrome remembers it; revocation/browser policy may require another prompt. No permanent tab, separate preparation step, anonymous capture, backend/provider spending before permission, or paid-limit change. Needs explicit approval because it is an exception to the user's sidebar-only interface constraint. Do not wire a popup until approved. Actual popup/microphone/capture proof remains pending.

## Approved sidebar opening/source/Start repair — 9 October 2026

User approved the plan for both opening orders, remembered sign-in, sidebar source selection/import without inspect/replace/delete, and one Start without additional tabs/windows. Implement independent meeting/auth/capture states and credential-change synchronisation; preserve explicit mode, same existing backend answer path, separate testing and current paid limits. An unpaid Meet-context microphone probe is added before changing the actual audio architecture. Do not mistake a simulated probe for real permission reuse. Target-tab tabCapture permission remains a Chrome constraint for sidebar-on-unrelated-tab then new Meet. Current microphone startup is deliberately not rewired until the actual candidate is proved; no permission popup or new service is authorised. Browser launch is blocked in this workspace. Follow SIDEBAR_PERMISSION_CHECK.md; milestone remains unfinished until real Chrome proof and the approved full audio flow work.

## Approved unpaid Meet-page audio prototype — 9 October 2026

User explicitly rejected sharing picker and approved a separate unpaid prototype after research. In experiments/meet-page-audio: sidebar-first or Meet-first, sample choice explicitly not connected to a document/AI, one Start, local meeting-candidate and microphone meters, Pause/Resume/Stop, Meet departure and original 60-minute cutoff. Read candidate media-element audio tracks and clone them without changing Meet originals; existing Meet microphone permission only; visible English mute control gates microphone. No tabCapture permission, sharing picker, recordings, provider/backend/login integration, secret, production changes or paid activation. The actual extension answer path remains unchanged. User's Chrome microphone probe succeeded in both orders; target-tab capture permission failed for sidebar-on-unrelated-tab then new Meet. This prototype tests an alternative, not a permission bypass or promised solution. Eight new simulated regressions/full106 tests pass; real Meet track exposure, separation, microphone selection, background continuity, screen-share behavior and cleanup require the documented Chrome check before integration approval.

## Approved real sidebar integration of Meet-page audio — 9 October 2026

User confirmed prototype capture/separation, mute, Pause/Resume, Stop without disrupting Meet, Meet departure and both opening orders; background continuity remains unproved. User approved integration plan. Implemented locally in development extension: joined-call Start without target-tab toolbar grant, tested page media core, secure bounded dual-channel PCM bridge, offscreen auth/provider owner, unchanged liveCalls/liveSpeech/liveAnswers answer backend. Removed activeTab/tabCapture and sidebar/offscreen microphone requests; archived dropped-origin capture checks/code. Local mic/worklet/two-block preflight precedes session admission, credentials and audio forwarding. Existing budgets/invitations/source ownership/context/original deadline retained. Scalar live frame/gap diagnostics added for real background proof, no call content analytics.107 tests and builds pass; actual integrated Chrome/audio/answers and available test capacity remain pending. Read-only Convex liveCallUsage check failed fetch/DNS; no reset/activation/budget change or provider request. Follow extension/meet/README.md for bounded development check before declaring milestone complete or asking to ship. Google sign-in presentation, shorter remembered login, independent freeze enforcement and performance remain parked.


10 October — approved independent-question sidebar plan: retain both speakers’ temporary current-call text; separate contextual detection from ordered answering; newer speech never cancels an accepted question; repeats are new requests; current/earlier answer cards remain visible. Pause suspends queued work with unchanged deadline; Stop clears it. Keep existing providers, four-answer test allowance and budget checks. Park multiple-participant identification for later. Real Chrome verification and development backend push required before declaring this working.

10 October verification update: development backend publication now succeeded, including the four-answer stopping fix. User verified customer answers with earlier cards visible, stopping at four answers on the same screen with the limit notice, no answer triggers from salesperson speech, window switching, Pause/Resume, automatic stopping on Meet departure and fresh answers for repeated questions. User observed Cuelo visible when sharing its window and absent when sharing a different window; do not promise invisibility or infer a whole-screen sharing test. No measured background continuity or latency results were supplied. Deferred: salesperson speech as useful answer context, mixed supported/unsupported multi-part questions and the real 60-minute cutoff check (see Parked). Safety-rejection recovery in real Chrome remains unconfirmed. These checks do not complete the full v1 release or authorise production deployment. See PROGRESS.md for the approved test-only budget adjustment and validation details.
