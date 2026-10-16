## Current implementation — 16 October 2026

Read [CURRENT_STATE.md](CURRENT_STATE.md) for the current approved behavior, test evidence, exhausted development allowance and release blockers. It supersedes conflicting older implementation notes below; unchanged policies and approval requirements still apply. This is a development GitHub checkpoint, not authorization to deploy, publish or enable further paid testing.

## Approved signed-in workspace — 14 October 2026

## Approved source selection and unified branding — 14 October 2026

This supersedes the older one-source-per-call restriction for extension calls. The panel uses a searchable multi-select dropdown with a closed selected-count, tick-mark options, Selected only review/removal and Done. Keep selections compact; no checkbox row clutter or outside tags. Up to 20 owned saved sources and 1,000,000 combined text characters per call are the explicit server input bounds; excessive selections are refused clearly rather than truncated. Reject empty, duplicate, excessive, missing, expired or foreign selections before spending admission. Legacy single-source API callers remain supported. Generic mode accepts no source selection. Sources are frozen for the active/paused session; each selected source is protected from website replacement/deletion, including secondary and legacy sources. Stop/expiry removes selection links and temporary text; saved content remains.

Document answers retrieve across selected sources with unique passage IDs and server-supplied document identity, retain 40-word/evidence/input limits, label each supported bullet with its actual source/reference and open the exact supporting passages. Conflicts are reported rather than silently choosing a source or falling back to generic answers. Both spoken and typed requests share this path. Multi-source quality is not established by simulated tests alone.

All content management stays on the website: panel Manage content opens the correct environment's Content page in a new tab; no embedded SourceManager remains in the panel. Source subscriptions update as saved content changes. One shared CueloWordmark and brand.css provide identical Nunito Sans font, size, weight, spacing and geometric round purple dot across landing, sign-in, Home, onboarding and extension. Development manifest now reuses approved blob icons. Chrome controls its outer grey header/close button; do not promise to recolour browser-owned UI. Retain the development label; published name is Cuelo. Development work only; no production/Store release or paid activation is authorized.


## Onboarding refinements — 14 October 2026

Detected installation skips Get Cuelo directly to Choose your knowledge, with a completion tick and no active installation link. Remove Check extension and the account-sharing sentence from this guide. Use my content opens the existing save/cancel content editor inline; saving leaves the user on step 2, with the saved source available in Content and the extension. The call step offers Google Meet, disabled Zoom and Microsoft Teams, and only two instructions: start/join the call, then open Cuelo; further setup happens in the extension. Preserve backend completion-based analytics unlocking and trial totals. Detect extension removal on Home: accounts with completed calls keep analytics, trial allowance and sidebar visible, with a reinstall reminder above the analytics; the reminder disappears automatically on reconnection. Before the first completed call, show the restore screen and resume the saved guide position after reconnection. Never replay onboarding for an account with completed calls. Development installation prompts identify the development extension instead of linking to the production Store package. Content/Profile stay accessible. This remains development-only, with no paid activation or Store/production update.


## Approved first-call journey — 14 October 2026

Website sign-up → role and company → guided Home: Chrome / disabled Mac / disabled Windows → general knowledge or optional saved content → Google Meet and Cuelo side panel → successful listening → Stop or Meet departure → analytics Home. Try Cuelo on a call → download choices → install Chrome extension → sign in in the side panel → Meet and Start remains available. Website onboarding details do not block extension-first calls. Sign in is required before any call; account trial remains three calls or 90 active listening minutes, whichever runs out first. Guided Home shows the remaining trial balance immediately. Saved guide progress survives returns; completed-call status comes only from owned backend call records. Pause keeps the same call active for onboarding purposes. Existing accounts with completed recorded calls go to analytics after their one-time details form. Role/company are for future personalization only. No transcript storage is introduced.


Signed-in website users land on Home in a light lavender glass workspace. Sidebar: Cuelo branding, Home, Content; Activity, Insights and Integrations disabled. Account menu: read-only Profile (Google name/email), disabled Settings/Contact us/FAQs and working shared Sign out returning to the public landing page. Content supports multiple named saved sources (pasted text, public page, PDF/Word), newest first, search/type filter/sort, add/edit modal with Save/Cancel and delete confirmation. Preserve existing saved sources; one explicitly selected source per call remains. Editing/deleting a source used by an active or paused call requires stopping that call first.

Home shows recent saved content and completed-call dates, listening durations and delivered-answer counts, aggregate totals and account trial remaining. No call transcripts, answer text, audio or AI conversation summaries are retained. This approved date/count-only call history supersedes older blanket no-history rules; v2 conversation transcripts/analysis remain parked. New recording begins with this update; do not fabricate historical call totals. Account isolation is enforced on the backend. Update privacy disclosures before publishing this behavior. Work is approved in development only; production deployment, store update, commit and push require separate approval.

## Approved account trial — 13 October 2026

This update supersedes older invitation-only live-call rules. Any Google-signed-in account may use up to three successful live calls or 90 minutes of active listening, whichever comes first, subject to the existing service availability and spending safeguards. Existing historical test calls do not consume the new trial. Trial ownership, call counts, listening time and admission are enforced on the backend per account across devices. Failed starts do not consume trial calls. Pause excludes listening time; Resume/reconnect continues the same session without another call charge. The existing 60-minute maximum per session remains. Stop, Meet departure and expiry settle time and delete temporary call text; only account usage totals remain. On trial exhaustion, capture and new answers stop, existing answers remain visible in the current sidebar, and paid-plan availability is explained without a purchase button. Sign-out clears these retained answers.

The landing page keeps its existing website question limits and replaces its document link with “Try Cuelo on a call” beside “Speak to Cuelo”. The chooser shows Windows and Mac as coming soon, and links to the Chrome Web Store only when the actual published listing is configured. No listing currently exists, so Chrome also honestly shows coming soon. Google signup/sign-in is required before a live call; website/sidebar share the account. No invitation workflow remains. Publishing the store listing, activating paid/live provider settings, committing, pushing and production deployment require their own approval.

# PRODUCT.md — Cuelo live-call answer assistant

## Approved landing-page update — 12 October 2026

This update supersedes older opening-demo wording and allowances only; live-call behaviour remains unchanged. Keep the existing landing-page visual identity. Add Features, About us and Pricing section links with Sign up/Log in on the right. Hero sentence: “Less digging through documents. More confidence answering questions on every call.” Opening card: “Try Cuelo.” / “Ask a question out loud. Get a short answer here.” Remove “Not from your document” from the landing experience at the user’s explicit request; retain document evidence and existing live-call provenance. Remove dragging/reset controls. The opening microphone captures one question, returns text and switches off; optional document selection stays on the landing page.

Logged-out visitors may submit three questions per India calendar day, counted at paid admission (including subsequent provider failures). Permission refusal, cancelled/invalid audio and disabled/budget-denied admission do not consume a daily question. Do not show the attempt count or reset time before use. At exhaustion retain the answer and show only “Log in to keep using Cuelo.”; never navigate automatically. Use a persistent random browser capability and atomic server checks so refreshes, tabs and windows in the same browser profile share the allowance. This cannot reliably identify someone after storage deletion, in private browsing or across profiles/devices. Temporary-source capabilities remain separate and ephemeral. Signed-in trial allowance is not yet agreed; keep existing invited live-call setup and do not grant additional paid access by assumption. No pricing figures or customer/database integrations may be invented.


Current live-call instructions reflect the approved native sidebar. Earlier exploration is historical; PROGRESS.md separates user-verified checks from unfinished release work.

# 1. The job

When I’m selling B2B software on a demo call and the customer asks a product question I don’t know the answer to, I want a short answer on screen so I can respond without losing track of the conversation. I can choose generic help or answers grounded in one product document. Generic help is always marked “Not from your document”; it does not verify my product’s facts.

I’m starting with account executives on product evaluation calls. The questions are about what the product does, how it works and its limitations. The rep uses it; the Head of Sales or CRO would decide whether to pay for it.

I want to solve the moment where the rep is searching a document, filling the silence and hoping a colleague replies. I’m leaving objection handling and discounts out of this version. They need different information and a different test.

# 2. The switch

**What they would fire:** opening tabs, searching help docs or messaging a colleague during a question. If the docs don’t answer it, the rep still needs to follow up.

| Force | What the product does | Where |
| --- | --- | --- |
| Searching takes attention away from the customer | Finds evidence for a completed customer question without the rep typing it | Question detection and retrieval |
| The rep wants an answer they can use quickly | Shows one short answer, the source link and section; supporting passage available on demand | Answer card |
| The rep worries about confident wrong answers | Makes the answer mode explicit. Every generic answer says “Not from your document”. Document answers cite evidence and refuse unsupported claims | Evidence and provenance check |
| The rep worries about distraction | No sounds, flashing, coaching or continuous commentary. One card, at most 40 words, dismissible with Esc or a click | Display |
| Manual searching gives the rep control | Rep can pause, stop, dismiss or enter a question manually | Session controls |

The rep chooses generic answers or answers from one document. Generic mode needs no upload. Document mode asks for one public help article or product document they can use and share as appropriate. In document mode the suggestion must match the source and preserve its limitations. Show conversational bullet points, at most 40 words excluding the citation, followed by the section/page and the source name last. In generic mode use the same short format and show “Not from your document” on every answer, without a document citation. There is no owner, approval, version or review-by workflow in v1. Uploads are used for that user’s session, not exposed to other users; explain retention and deletion before upload.

**Onboarding worry:** Can I use this without missing what the customer says next?

# 3. The core flow

## Today

The original journey describes this: customer asks → rep tries to remember → searches a document while filling the silence → tries another source or messages a colleague if needed → checks and rephrases the answer → responds. If nothing reliable turns up, the rep researches and emails after the call.

This is a provisional journey, not a reconstruction of one actual call. To establish the baseline, use one recent call and record the exact question, searches/messages, time to answer, filler conversation and outcome. Compare rep actions and elapsed time on the same question. There is no supported “11 versus 6” claim yet.

## With the product

| Step | What happens | Must not happen |
| --- | --- | --- |
| Start | Rep joins Meet, opens the native Cuelo sidebar, signs in with Google if needed and explicitly chooses generic/document mode. Document mode requires one selected/imported source. Start begins the separate audio inputs with visible status, Pause and Stop. No persistent website controller or sharing picker. Inform participants and obtain any needed listening permission. | Hidden or unstoppable listening |
| Detect | Recognise a completed factual customer question. Stay quiet for rep speech and unrelated conversation. | Wrong-speaker triggers or invented interpretations |
| Answer in the chosen mode | Generic: use general knowledge and mark every card “Not from your document”. Document: search the selected source and check that its passage answers the question, including limitations. | Silently mixing modes or inventing company-specific facts |
| Decide | Document mode: supported answers have citations; missing evidence says “I couldn’t find this in your source.” Conflicts say “The docs conflict—confirm before answering.” Generic mode does not claim verified product facts. | Unsupported product facts, commercial promises or an unlabelled generic fallback |
| Show | Rep sees the question and bite-sized conversational bullets. Document mode: section/page then source name last, supporting passage available. Generic mode: “Not from your document” in plain sight. | Long reading, hidden qualifications or hidden provenance |
| Keep relevant | Queue each recognised question independently. Later speech never cancels accepted questions; repeated questions get fresh answers. Retain earlier cards below the latest. | Dropping an accepted question or attaching an answer to the wrong question |
| Resolve | Rep answers in their own words; customer confirms or asks a follow-up. If unverified, rep agrees what needs checking and when they will respond. | Counting displayed text as a resolved question |

If audio fails, show “Listening unavailable” and stop automatic suggestions. If a question is unclear, request repetition or manual entry rather than guessing. Manual questions use the same selected-mode and provenance rules.

A follow-up commitment is safe failure, not in-call success. The question is resolved when the customer receives an adequate verified answer.

# 4. Onboarding — first value before login

## Opening voice experience

The first website screen shows “Your quiet assistant for live calls,” a friendly listening blob, “Ask me anything,” and an obvious microphone action. Users speak; Cuelo replies only in text. This is a demo, not a connected call. It welcomes broad questions and responds promptly. Every generic answer card visibly says “Not from your document”. Do not promise that it can accurately answer every possible question or guarantee zero latency. Adding one document or public help link switches to source-grounded answers; do not silently blend unsupported general knowledge into source-based responses.

Limit the opening experience to five completed generated answers. Predefined welcome text and scrolling hints do not count. After five, show a gentle signup invitation without forcing navigation. The three-question practice call remains available without signup and has a separate allowance. No artificial typing delay for answers.

The blob follows a safe fixed path during the first 20 seconds without covering text or buttons; afterwards it becomes draggable with its answer panel. User positioning takes priority. Cuelo never speaks. Detailed visual rules and screen states are in DESIGN.md.

## Source-based first-value practice

**First value:** “The avatar asked about my product, the assistant heard the question and showed a correct answer quickly, and it stayed quiet when I spoke.”

The rep tries an interactive practice call on the product website before logging in or connecting a real meeting. No colleague, signup or question typing is needed. There are exactly three supported customer questions; the demo includes no deliberately unanswered question.

## Website interface

Below the opening voice section, use a calm invitation surface labelled “Experience Cuelo on a call,” with no subtitle underneath. A predefined blob hint may say “Try me on a customer call. Use a sample, or add your own document.” No call-demo shortcut in the first viewport for now. The practice interface has, on the left, a customer avatar with spoken questions and a speaking indicator. Right: an assistant preview styled like the live-call answer panel, with Listening status, the recognised question, a short answer, section/page followed by the source name last, and measured response time. Bottom: Start, Pause, Stop and Replay. Label the experience “Practice call.”

## From website to first value

1. **Click “Experience Cuelo on a call.”** Choose “Try with a sample” or “Upload my document.” The sample includes a product introduction and a public help article. Uploading lets the rep use their own product FAQ or help document without typing questions.
2. **Prepare three supported questions.** Read the chosen source and select three distinct realistic customer questions with clear supporting passages. If the document is unreadable or cannot support three questions, ask for a different document or offer the sample before starting. Do not invent facts to complete the demo. Generate the avatar’s voice for the personalised questions.
3. **Enable the microphone and introduce yourself aloud.** Confirm microphone input and show Listening, Pause and Stop. The introduction checks audio reception, not a voiceprint. Avatar audio and the rep’s microphone are separate inputs.
4. **Question 1: hear the avatar and see a live answer.** The avatar speaks. The assistant detects the question from its audio, searches the selected source and generates an answer automatically. Show at most 40 words, the source section/page and actual elapsed time from question end to answer display. The rep can inspect the supporting passage and respond aloud.
5. **Question 2: experience the same help again.** Leave time for the rep’s response, then let the avatar ask the second question. The assistant stays quiet for rep speech, including a question they ask aloud. Replace the first card with a fresh answer to the avatar’s question.
6. **Question 3: complete the practice.** The avatar asks the third supported question; the assistant generates and displays its answer live. Leave time for the rep to respond. There is no fourth question and no missing-answer example in onboarding.
7. **Offer a real call after first value.** After the third answer and response window, show: “Ready for your next call? Sign up and add Cuelo to a call.” Button: “Sign up / Log in.” The rep can still review the answers or replay without logging in. Login and the Meet link are required only when they choose to use a real call.

**First-value success:** all three avatar questions are correctly detected and produce supported answers within the five-second target; no suggestions are triggered by the rep’s speech. The rep can check the sources and use the answers aloud. Post-demo login and call connection are tracked separately from answer correctness and speed. If a real failure occurs, show it honestly and offer retry rather than claiming three successful answers.

**The experience must be real:** the avatar may prepare its questions, but the answer assistant receives the source and audio, not a prewritten answer key or the avatar’s question text as a shortcut. Generate answers during the session; do not preload cards or trigger them with playback timestamps. Show measured latency rather than a fixed “instant” claim.

## After first value: login and Google Meet

The live-call product uses the approved Chrome extension's native sidebar; the website remains the landing, account and practice surface. The earlier website-controlled floating-card route is superseded for current live calls.

Approved shared sign-in revision, 10 October: with the matching extension installed in the same Chrome profile, signing in from either the website or sidebar signs the user into both as the same account; sign-out clears both. An active call stops before sign-out/account changes. Without the extension the website still supports Google account/source management; installing/reloading requires refreshing existing Cuelo pages. Test/production never share sessions. Existing different accounts must be resolved explicitly, not silently switched. The website's former call-connection controls and direct live URL now lead to sidebar guidance; no website audio or paid session starts from that guidance. Real Google checks are pending.

1. Open Cuelo before or after joining Meet in the same Chrome window. Sign in with Google from the sidebar if needed. The accepted temporary Google sign-in window presentation is parked for improvement; no persistent Cuelo website tab is required.
2. Explicitly choose generic answers or owned saved sources. Generic needs no source. Document mode uses the compact multi-select picker; Manage content opens the website for content changes.
3. Click Start once after Chrome grants access to the selected Meet tab. Direct tab audio and the separate Meet-page salesperson microphone are checked before paid admission. Chrome may require an extension-icon click on Meet; no tab-sharing picker or floating window is used.
4. Recognised customer questions enter independent ordered answering; later speech does not cancel them. Salesperson speech adds temporary context and never triggers answers. Keep completed cards visible while processing; repeated questions receive fresh answers.
5. Pause stops audio/transcription and suspends waiting work; Resume keeps the original deadline and temporary context. Stop and Meet departure clear waiting work and server call text, release Cuelo audio and leave Meet itself running.
6. At the configured test answer limit, stop capture/transcription and waiting work, retain completed answers on the same non-resumable screen and show the limit notice. Current test limit: four answers; no new answers until a separately admitted new session.

**Presentation privacy:** user observed Cuelo visible when sharing its window and absent when sharing a different window. Whole-screen sharing was not separately verified and may expose Cuelo. Never promise invisibility.

**Stopping limitation:** the approved restricted v1 uses page-controlled shutdown. Backend access/spending checks do not independently close an established provider stream if the browser freezes or is modified. The 55-minute warning and 60-minute real Chrome test remain required but user-deferred.

The practice demonstrates avatar-audio recognition, separation from the microphone, source accuracy and response speed. It does not prove real-call capture, same-channel speaker identity or presentation privacy. Those require the live-call checkpoints.

Real calls are English-only and at most 60 minutes. Warn at 55 minutes and stop Cuelo at 60 without ending Meet. Remember the full current-call discussion temporarily, then clear it; no past-call history or audio storage.

Document mode uses one source per session; generic mode needs none. Fetch a public page for each new session; if loading fails, show source unavailable rather than silently using an old copy. Accept a replacement upload when a source gap appears. Whole-help-centre search and internal-system integrations come later.

# 5. v1

| Classification | Scope |
| --- | --- |
| Must have | Opening voice-to-text interaction with general-knowledge/source labels and five generated answers; fixed scrolling hints and draggable blob after 20 seconds; interactive website demo before login with sample or uploaded document and three spoken avatar questions with live answers; after first value, login and Google Meet link entry; browser tab-audio and separate microphone capture; native Chrome sidebar answer cards; truthful connection states and Hide answers; one public article or uploaded product document per session; source loading; customer-question detection; explicit generic/document answer choice at signup and call setup; “Not from your document” on every generic card; grounded document answers; section then source name last; supporting passage on demand; safe failure; short dismissible card; independent question queue and retained earlier cards; pause/stop; listening-failure and manual-question paths; saved link/settings after signup |
| Optional later | Personal post-call summary, after a separate value test; outside this sprint and milestones |
| Parked | Desktop app, guaranteed screen-share invisibility, approval workflows, private-system integrations and automatic internal-source ingestion, objection handling, discounts, sentiment, agenda preparation, coaching, email generation/sending, CRM/database/calendar/email integrations, whole-help-centre search and cross-call learning |

**Repeat value:** observe five pilot reps for 14 days after first live use. A repeat success means the rep voluntarily uses it on their third relevant call, uses at least one verified answer the customer accepts, and misses no customer question because of reading. Fewer than three relevant calls means not yet observable.

Proposed continuation threshold: at least three of five repeat successes, zero unsupported answers spoken and zero unsupported commercial promises. Record unanswered questions and distraction incidents too. Signup does not prove repeat value. Score grounded and generic sessions separately: generic cards must be labelled and must not be treated as verified product answers.

# 6. The riskiest guess

I’m betting that public help docs can give a rep a useful answer fast enough to use on a call, without making them miss what the customer says next. If the answer is wrong, late or distracting, the product hasn’t done its job.

I don’t need internal material to try this. I’m using one article from Slack’s public help centre: [Pause your Slack notifications](https://slack.com/intl/en-gb/help/articles/214908388-Pause-your-Slack-notifications). No Atlassian internal material is used.

## What was actually run on 4 October 2026

The assistant read that article and produced the six responses below using only its content. It then checked them against the named sections. This is an exploratory desk check, with the same assistant answering and checking. It is not an independent evaluation, a built product test or a completed 30-minute practice call.

| Question | Response from this desk check | Source section | Check |
| --- | --- | --- | --- |
| How do I pause notifications on desktop? | Open your profile menu, hover over Notifications and choose a duration or custom time. | Pause notifications — Desktop | Supported |
| Can I schedule quiet hours? | Yes. Set the days and hours when notifications are allowed; they pause outside that schedule. | Set a notification schedule | Supported |
| What command resumes notifications? | Use `/dnd off`. | Shortcuts and commands | Supported |
| Is pausing notifications restricted to paid plans? | No. It is available to all members on all subscriptions. | Who can use this feature? | Supported |
| What discount will Slack give our company for 500 seats? | I can’t verify that from this article. | No supporting section | Correct abstention |
| Can I promise that absolutely nobody can notify me while paused? | No. The article describes urgent DM overrides and VIP exceptions, so don’t promise complete silence. | How it works; VIP tip | Necessary qualifications retained |

**Result:** four straightforward answers were supported, the absent discount question got no invented answer, and the absolute claim was qualified. No contradiction was introduced into the public article, so conflict handling remains untested. No per-question latency, listening accuracy or human attention result was measured.

This gives me a reason to try the practice call. It does not give me a reason to call the scope locked.

## The remaining 30-minute no-code risk test (separate from onboarding)

Spend 10 minutes preparing the six questions above, the article and a simple score sheet. Use an AI tool with the article attached and this instruction: “Answer only from this article, in at most 40 words. Give the source section. If it doesn’t answer the question, say you can’t verify. Preserve exceptions.”

The three-question website demo is the onboarding flow, not a completed validation result. Missing-answer and conflict cases remain separate safety tests and are not deliberately included in onboarding. Before that demo is built, run the following 30-minute no-code risk test with a real rep and a colleague playing the customer:

- First 5 minutes: set up the article, roles and stopwatch. Don’t show the rep the desk-check answers in advance.
- Next 15 minutes: ask the six questions in a different order. An observer enters each completed question into the tool and shows the response. The customer adds a new relevant point while the rep reads.
- Next 5 minutes: check every answer against the article and ask the rep what the customer said next. Record repetitions caused by reading.
- Last 5 minutes: score the result and decide what needs changing.

Pass only if all four direct answers are correct, the absent question gets no invented answer, the absolute claim retains its exceptions, every response appears within five seconds of the question ending, and the rep retains the next point in all six rounds while using at least three direct answers. The five-second measure includes manual entry; log entry time separately so a slow simulation can be diagnosed.

Record each question, actual answer, source section, elapsed seconds, whether the answer was used, and whether the next point was retained. A safe refusal doesn’t count as a useful factual answer.

**Current decision:** proceed to the timed human practice; do not lock yet. That result cannot be supplied by rewriting this document.

# 7. Milestones — what I can do

PLAN.md follows these outcomes in this order. PROGRESS.md records confirmed results. Setup and deployment are tasks inside a milestone, not substitutes for an observable outcome. No milestone is complete yet.

1. **I can get a grounded answer I can check.** Ask questions against one public SaaS help article and get short conversational bullet-point answers, section/page then source name last, and an inspectable supporting passage. Test the six questions in Section 6: four direct answers, the missing discount answer and the qualified absolute claim. A separate human checker verifies the result in the chosen prototype. Test conflicts separately in a labelled fixture. This is the first milestone and the first evidence gate; the existing assistant desk check does not complete it. Deepgram and the voice avatar come later. Typed questions are allowed in this evaluation tool, not in the customer’s voice onboarding.
2. **I can use the answer without losing the conversation.** Complete the timed human practice in Section 6. All six responses meet its correctness/safe-failure checks and five-second target; the rep retains the next point in every round and uses at least three direct answers. Record actual timings and attention results. If it fails, change the approach before adding voice complexity.
3. **I can speak and see Cuelo respond, and it can distinguish customer audio from mine.** After milestones 1 and 2, add Deepgram English transcription. Prove the opening voice-to-text demo, five-answer allowance and visible “Not from your document” on every generic answer. In a practice setup, recognise four spoken customer questions while the rep uses a separate microphone; four rep questions and ordinary statements cause no suggestions. Show audio loss honestly. Verify real Meet-tab capture and separate mic input; a Meet link alone is not connection proof.
4. **I can keep the assistance relevant and stop it.** Later speech never cancels an accepted customer question; repeated questions get fresh answers. Dismiss, Hide, Pause and Stop work as described; paused speech produces no suggestions and Stop releases capture. Generic provenance stays visible on every generic card; document mode never silently falls back. The 55-minute warning and 60-minute cutoff work without ending Meet. Retain current-call context temporarily and clear it at session end.
5. **I can experience three live answers before signing up, then bring Cuelo to my call.** Add the illustrated speaking avatar after the grounding and listening milestones. It asks exactly three source-supported questions; answers are generated from its audio, not a prepared answer key. Verify three correct answers within the five-second target and no rep-speech triggers. Then offer Google-only sign-in, generic/document choice and the Meet flow. Generic mode needs no upload and labels every answer “Not from your document”; document mode asks for one source. Invited testers use the native Chrome sidebar. Test participant views without claiming invisibility. Missing and conflicting evidence tests stay outside onboarding.
6. **I can rely on it enough to use it again.** Run the five-rep/14-day pilot in Section 5 after the combined live flow passes. Record voluntary third-call use, accepted verified answers and missed customer questions. Score generic sessions separately from grounded product answers. Enforce the combined ₹5,000 monthly test budget and reduce testers before reducing quality.
7. **I can return without setting up my source again.** For signed-in users, retain the selected source until replaced/deleted and preserve approved settings. Reopening starts listening OFF, asks for an explicit answer-mode choice and requires a new Start and successful audio preflight. Document mode can reuse the saved source; generic mode requires none. No audio, past-call transcript or answer history is retained.

**Shipping for every built milestone:** the only product and submission URL is the sprint’s .convex.site link. Deploy with npm run deploy; a push never deploys automatically. Build the minimum website and asset-serving setup needed for the current outcome. After the user confirms it works: commit, push, update PROGRESS.md, then deploy.

No approval workflow, summary or integration is needed to pass these milestones.

## Approved live-call interface revisions — 8–10 October 2026

The native sidebar and Meet-page audio path above supersede the earlier floating-card, toolbar-authorised tabCapture and website-controller-tab proposals. Neither the website controller nor a permanent new window is allowed. Source selection/import, Start, answers/evidence and Pause/Resume/Stop stay in the sidebar. The hidden extension document owns the authenticated call. Current development Chrome checks and known limitations are in PROGRESS.md; production publication requires separate user approval. No new provider, recordings or past-call history are introduced.

## Knowledge-first Home refinement — 14 October 2026

Before the first completed call, each visit to Home opens Choose your knowledge when the extension is installed, even if the saved guide step was call. Continue opens call instructions within that visit. The document option lists every owned saved source by name/type, loads additional pages rather than limiting to the five recent items, and supports adding several sources through the inline editor. These are saved-library entries, not a claim that all are used simultaneously; the extension still chooses one source per call. Completed-call accounts retain analytics Home and the reinstall reminder. Same-visit extension recovery keeps the current step; a new Home visit starts with knowledge.

## Approved extension design and typing — 14 October 2026

Development sidebar uses the website's light lavender glass theme, local Nunito Sans fonts, branded blinking/breathing CSS blob, Google Sign in, and an account menu with Sign out. Sign out remains available during a call and stops capture first. Active call answers appear above a fixed compact composer with Listening/Answering/Paused status, Pause/Resume, Stop, and a typed-question field/send action. Earlier answers remain expandable; generic answers retain visible provenance and document answers open evidence. Reduced motion disables animation. Source import and original audio/session controls remain functional.

Typed questions are explicit user submissions during a successfully connected listening session only. They join the same ordered queue and temporary call context as spoken questions, use the session's chosen mode/source, share answer/question capacity and trial/session/spending controls, and are deleted with call text. They do not run paid question classification but count against session question capacity. Pause disables typing; Resume restores it. Stop and sign out clear unsent draft text. Backend ownership, live-enabled flag, generation, active listening, input capacity and limits are enforced; browser controls alone do not authorize a request. Production four-answer limit remains disabled; development test limits remain. No additional service/host permission, recording, transcript retention, paid activation or Store update is authorized.
