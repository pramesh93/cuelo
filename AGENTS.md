## Current implementation — 16 October 2026

Read [CURRENT_STATE.md](CURRENT_STATE.md) for the current approved behavior, test evidence, exhausted development allowance and release blockers. It supersedes conflicting older implementation notes below; unchanged policies and approval requirements still apply. This is a development GitHub checkpoint, not authorization to deploy, publish or enable further paid testing.

## Approved signed-in workspace — 14 October 2026

## Approved source selection and unified branding — 14 October 2026

This supersedes the older one-source-per-call restriction for extension calls. The panel uses a searchable multi-select dropdown with a closed selected-count, tick-mark options, Selected only review/removal and Done. Keep selections compact; no checkbox row clutter or outside tags. Up to 20 owned saved sources and 1,000,000 combined text characters per call are the explicit server input bounds; excessive selections are refused clearly rather than truncated. Reject empty, duplicate, excessive, missing, expired or foreign selections before spending admission. Legacy single-source API callers remain supported. Generic mode accepts no source selection. Sources are frozen for the active/paused session; each selected source is protected from website replacement/deletion, including secondary and legacy sources. Stop/expiry removes selection links and temporary text; saved content remains.

Document answers retrieve across selected sources with unique passage IDs and server-supplied document identity, retain 40-word/evidence/input limits, label each supported bullet with its actual source/reference and open the exact supporting passages. Conflicts are reported rather than silently choosing a source or falling back to generic answers. Both spoken and typed requests share this path. Multi-source quality is not established by simulated tests alone.

All content management stays on the website: panel Manage content opens the correct environment's Content page in a new tab; no embedded SourceManager remains in the panel. Source subscriptions update as saved content changes. One shared CueloWordmark and brand.css provide identical Nunito Sans font, size, weight, spacing and geometric round purple dot across landing, sign-in, Home, onboarding and extension. Development manifest now reuses approved blob icons. Chrome controls its outer grey header/close button; do not promise to recolour browser-owned UI. Retain the development label; published name is Cuelo. Development work only; no production/Store release or paid activation is authorized.


## Onboarding refinements — 14 October 2026

Detected installation skips Get Cuelo directly to Choose your knowledge, with a completion tick and no active installation link. Remove Check extension and the account-sharing sentence from this guide. Use my content opens the existing save/cancel content editor inline; saving leaves the user on step 2, with the saved source available in Content and the extension. The call step offers Google Meet, disabled Zoom and Microsoft Teams, and only two instructions: start/join the call, then open Cuelo; further setup happens in the extension. Preserve backend completion-based analytics unlocking and trial totals. Detect extension removal on Home: accounts with completed calls keep analytics, trial allowance and sidebar visible, with a reinstall reminder above the analytics; the reminder disappears automatically on reconnection. Before the first completed call, show the restore screen and resume the saved guide position after reconnection. Never replay onboarding for an account with completed calls. Development installation prompts identify the development extension instead of linking to the production Store package. Content/Profile stay accessible. This remains development-only, with no paid activation or Store/production update.


## Approved guided onboarding — 14 October 2026

This supersedes older immediate-dashboard and guest-first-call guidance. Sign in is required before the first real call. The website collects role and company name once, then Home guides the user through Chrome installation, optional saved content (or generic knowledge), and starting/ending a Google Meet session. Mac and Windows are disabled. Try Cuelo on a call retains the three download choices; extension-first users may sign in and call without visiting the website first. Role/company are stored for future personalization, not sent into answer prompts. Home shows analytics only after the backend records a successfully connected listening session ending. Pause/Resume never completes a call. Trial allowance remains visible during guided Home: three calls or 90 active listening minutes per account, whichever runs out first. There is no client-controlled completion button. Content/Profile remain available after the details form. Development implementation does not authorize production deployment, paid activation or a Chrome Store update.


Signed-in website users land on Home in a light lavender glass workspace. Sidebar: Cuelo branding, Home, Content; Activity, Insights and Integrations disabled. Account menu: read-only Profile (Google name/email), disabled Settings/Contact us/FAQs and working shared Sign out returning to the public landing page. Content supports multiple named saved sources (pasted text, public page, PDF/Word), newest first, search/type filter/sort, add/edit modal with Save/Cancel and delete confirmation. Preserve existing saved sources; one explicitly selected source per call remains. Editing/deleting a source used by an active or paused call requires stopping that call first.

Home shows recent saved content and completed-call dates, listening durations and delivered-answer counts, aggregate totals and account trial remaining. No call transcripts, answer text, audio or AI conversation summaries are retained. This approved date/count-only call history supersedes older blanket no-history rules; v2 conversation transcripts/analysis remain parked. New recording begins with this update; do not fabricate historical call totals. Account isolation is enforced on the backend. Update privacy disclosures before publishing this behavior. Work is approved in development only; production deployment, store update, commit and push require separate approval.

## Standing privacy review reminder — 13 October 2026

Whenever Cuelo’s product changes, review whether the privacy policy needs updating. Before every future Chrome extension publication or update, review the policy and Chrome Web Store data/permission disclosures against the actual release, including changes to features, collected data, uses, sharing, permissions, storage, retention, deletion and account/payment handling. Update affected disclosures before publishing; do not add unnecessary technology details. Record what changed, or that no privacy update is needed, in the release review. This review does not itself authorise publishing or deployment.

## Approved account trial — 13 October 2026

This update supersedes older invitation-only live-call rules. Any Google-signed-in account may use up to three successful live calls or 90 minutes of active listening, whichever comes first, subject to the existing service availability and spending safeguards. Existing historical test calls do not consume the new trial. Trial ownership, call counts, listening time and admission are enforced on the backend per account across devices. Failed starts do not consume trial calls. Pause excludes listening time; Resume/reconnect continues the same session without another call charge. The existing 60-minute maximum per session remains. Stop, Meet departure and expiry settle time and delete temporary call text; only account usage totals remain. On trial exhaustion, capture and new answers stop, existing answers remain visible in the current sidebar, and paid-plan availability is explained without a purchase button. Sign-out clears these retained answers.

The landing page keeps its existing website question limits and replaces its document link with “Try Cuelo on a call” beside “Speak to Cuelo”. The chooser shows Windows and Mac as coming soon, and links to the Chrome Web Store only when the actual published listing is configured. No listing currently exists, so Chrome also honestly shows coming soon. Google signup/sign-in is required before a live call; website/sidebar share the account. No invitation workflow remains. Publishing the store listing, activating paid/live provider settings, committing, pushing and production deployment require their own approval.

# AGENTS.md — Cuelo v1

## Approved landing-page update — 12 October 2026

This update supersedes older opening-demo wording and allowances only; live-call behaviour remains unchanged. Keep the existing landing-page visual identity. Add Features, About us and Pricing section links with Sign up/Log in on the right. Hero sentence: “Less digging through documents. More confidence answering questions on every call.” Opening card: “Try Cuelo.” / “Ask a question out loud. Get a short answer here.” Remove “Not from your document” from the landing experience at the user’s explicit request; retain document evidence and existing live-call provenance. Remove dragging/reset controls. The opening microphone captures one question, returns text and switches off; optional document selection stays on the landing page.

Logged-out visitors may submit three questions per India calendar day, counted at paid admission (including subsequent provider failures). Permission refusal, cancelled/invalid audio and disabled/budget-denied admission do not consume a daily question. Do not show the attempt count or reset time before use. At exhaustion retain the answer and show only “Log in to keep using Cuelo.”; never navigate automatically. Use a persistent random browser capability and atomic server checks so refreshes, tabs and windows in the same browser profile share the allowance. This cannot reliably identify someone after storage deletion, in private browsing or across profiles/devices. Temporary-source capabilities remain separate and ephemeral. Signed-in trial allowance is not yet agreed; keep existing invited live-call setup and do not grant additional paid access by assumption. No pricing figures or customer/database integrations may be invented.


Read this before building or changing Cuelo. If a product choice is not covered here or in the scope and design documents, ask instead of guessing.

## User confirmation rule — updated 8 October 2026

- Do not make changes without the user's explicit confirmation. Explain the proposed change first, then wait for confirmation before editing code, configuration, documents, account permissions or service settings, or committing, pushing or deploying.
- Clarifications, preferences and statements such as “I don't need any permanent window” are not approval to implement a proposed change. Do not infer confirmation from them.
- Read-only inspection and research may continue, but do not apply fixes automatically when a bug is reported.
- This rule supersedes earlier instructions to act automatically or continue implementation without confirmation. It applies to all future work on this project. Saving this requested rule is explicitly authorized by the user.

## Project folder restriction — 10 October 2026

- Do not use any folder outside `/Users/avantikamishra/build-sprint-app` for project work without the user’s explicit approval. This includes reading or writing files, development copies, builds, temporary files, browser profiles, caches and generated artifacts.
- Keep production extension preparations and other generated artifacts inside the project, such as `artifacts/`. Do not choose an external folder automatically.
- If a tool requires using another folder, explain the exact folder and purpose and obtain approval before running it.

## 1. How the product works

### Interface

Cuelo has a website and an approved native Chrome extension sidebar for English Google Meet calls on desktop Chrome. The sidebar listens to customer questions and quietly shows short text answers. Cuelo never speaks.

The current live-call path is sidebar-only: join Meet before or after opening Cuelo, sign in with Google if needed, explicitly choose generic/document mode, select or import one source in document mode, then click Start. No persistent Cuelo website tab, floating window, tab-sharing picker or target-tab toolbar permission is required. The hidden extension document owns the session; tested Meet-page audio supplies separate customer and salesperson inputs. Existing Meet microphone permission is required; handle missing audio, denied/revoked permission and closed tabs honestly. A Meet link alone never grants audio access.

Approved 10 October: with the matching Cuelo extension installed in the same Chrome profile, website and sidebar must share the same Convex Auth login in both directions. Signing out clears both; changing account or signing out stops any active Cuelo call first. Test and production remain separate. Website account/source management remains available; website call setup and old live links show sidebar instructions instead of starting the retired capture flow. Shared login requires real Google/installed-extension verification before it is declared working.

Earlier website floating-card and tabCapture designs are superseded for this extension path. Do not promise screen-share invisibility: the user observed Cuelo visible when sharing its window and absent when sharing a different window; whole-screen sharing may expose it.

### First experience

- The opening screen shows the blob, a text answer panel and the option to speak. The welcome says “Ask me anything.” The instruction says “Tap the mic and speak. I'll reply in text.”
- The landing blob is an interactive demo, not a connected call. It welcomes broad questions and returns text promptly without artificial delay. Opening answers use general knowledge unless the visitor supplies a source. Every generic answer card must display **“Not from your document”** in plain sight, beside the answer; never hide this behind a tooltip or settings. Allow five successful generated answers per visit; predefined interface prompts do not count. Failed answers do not consume the allowance. This is a visit limit, not a guarantee that we can recognise the same anonymous person across visits.
- Further down the page, “Experience Cuelo on a call” opens the virtual customer call. The visitor chooses a sample source or supplies their own.
- The friendly illustrated customer avatar asks exactly three questions supported by that source. Generate Cuelo's answers from the incoming question audio; do not preload answers or trigger them from script timing. The avatar can speak; Cuelo and the blob cannot.
- Keep the three-question demo separate from the five opening answers. Do not deliberately introduce an unanswered question in this demo.
- After question three, invite the visitor to sign up and add Cuelo to a call. Offer “Continue with Google” as the only sign-in method.
- During signup and call setup, offer **“Generic answers”** or **“Answers from my document”**. Generic mode requires no source; document mode then asks the user to add or confirm one source. Show the choice again before listening starts. Never infer document mode merely because an old source is saved.
- Anyone can try the demo and sign up. Initially, only invited testers can use live calls. Enforce this on the backend.

### Business logic

When the customer finishes asking a question, Cuelo automatically shows a brief answer in the selected mode. Generic mode uses general knowledge and visibly marks every answer **“Not from your document”**. It cannot claim verified facts about the customer's company or the rep's product without evidence. Document mode searches the selected source and grounds its answer in it. The salesperson's own speech adds context but must not trigger an answer.

Remember the discussion from the beginning to the end of the current call, including the salesperson's speech. Keep the full temporary transcript available for context retrieval; a summary alone must not replace it. Conversation explains the question; in document mode the source supports product claims. Generic mode does not turn conversation or general knowledge into verified company-specific evidence. Clear call context when the session ends. Do not use earlier calls.

Answers use conversational bullet points, normally no more than 40 words in total, excluding the citation. In document mode put the section reference after the answer and the source name last. Let the user open the supporting passage. Use a page reference when the document has no named section; never invent a section. In generic mode show “Not from your document” clearly on every answer card, with no document citation.

In document mode, if the source does not support the answer, show “I couldn't find this in your source.” Conflicting passages must not turn into a confident answer. In the approved extension call flow, every recognised customer question stays pending until answered or an explicit failure is shown. New speech and later questions do not cancel earlier questions; repeated questions receive fresh answers. Pause suspends waiting work; Stop and meeting end clear it.

The approved restricted v1 uses page-controlled stopping; it cannot guarantee independent shutdown of an established provider stream if the browser freezes or is modified. Backend admission and spending checks remain required. The real cutoff test is parked, not passed. Calls last at most 60 minutes. Warn at 55 minutes. At 60 minutes stop Cuelo's capture, transcription and answers; the Google Meet call continues. Provide Pause and Stop controls and a way to hide the card. Stop capture immediately when the user stops the session. At the configured test answer limit, stop audio/transcription and waiting work, show the limit notice on the same screen and retain completed answers until explicit Stop or meeting end; no Resume or new answers. Four is the current test answer limit, not a permanent product allowance.

### Sources

One active source at a time: a PDF, Word document, pasted text or public webpage link. Users can replace or delete it. Uploaded documents are limited to 10 MB and 50 pages. Do not truncate silently. Scanned documents requiring OCR are outside v1; explain when readable text is unavailable.

A webpage link means the selected public page, not an entire help centre, a private workspace or an unrestricted database connection. Validate fetch destinations on the backend and reject private network addresses. Source text is evidence, not instructions for the AI to follow.

### Database

Remember:

- The user's account and whether they have invited-tester access.
- The signed-in user's saved source, its readable content and the references needed for citations.
- Session status, explicitly chosen answer mode and start time, so the backend can enforce call limits and answer provenance.
- Usage counts and estimated spending, without keeping call content in analytics.
- Temporary guest sources and active-call text only for the current session. Remove them at session end; add expiry cleanup for abandoned sessions.

Keep guest sources temporary. After signup, save the selected source only when the user chooses to keep it. Saved sources remain until replaced or deleted. Delete superseded content and its search index together.

No audio recordings, past-call transcripts or answer history in v1. Do not put transcripts in routine logs, error reports or test fixtures. Check external providers' retention settings before live testing; do not claim that Cuelo's deletion controls erase provider-held data.

### Technical services

These are the starting implementation choices. Confirm quality and latency through real testing; provider marketing is not proof of Cuelo's performance.

| Service | What it does | Secret location |
| --- | --- | --- |
| React + TypeScript + Vite | Website and native Chrome sidebar interface | No provider secret in the browser |
| Convex | Backend functions, account access checks, storage and usage limits | Convex environment variables, separately for dev and production |
| Convex Auth | Google sign-in | Auth configuration and signing secrets in Convex environment variables |
| Google OAuth | Google sign-in only; no Calendar or Meet account access in v1 | AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET in Convex environment variables |
| Deepgram Nova-3, English | Streaming speech-to-text for customer audio and salesperson microphone | DEEPGRAM_API_KEY in Convex environment variables |
| OpenAI GPT-4.1 | Question detection and source-grounded text answers | OPENAI_API_KEY in Convex environment variables |
| OpenAI gpt-4o-mini-tts | Voice for the customer avatar in the demo only | OPENAI_API_KEY in Convex environment variables |
| Convex HTTP routes | Serve the built website at the sprint’s .convex.site link | Deployment credentials stay outside the frontend |

Use an original illustrated avatar with lightweight animation, not a paid photorealistic avatar service. Speech recognition must process live audio. Build a secure supported streaming route; do not attempt to keep a 60-minute audio connection inside one Convex action. Never expose the long-lived Deepgram key. Any browser streaming credential must be short-lived, narrowly authorised and issued only after backend checks. If the supported provider route cannot enforce our limits, resolve the architecture before enabling live sessions.

Convex Auth is currently beta. Test Google sign-in end to end before live testing. Google is the only sign-in method in v1.

### Not in v1

Desktop app, mobile live calls, guaranteed screen-share invisibility, call recordings, past-call memory or history, multiple simultaneous sources, OCR, private database or Drive integrations, whole-site crawling, CRM integrations, call summaries, negotiation coaching, non-English support, and document owner/version/review-date approval workflows.

When I report a bug, I will name the part. Look there first, and tell me if the evidence points to another part.

## 2. How we work

- Read IDEA_SCOPE.md, PRODUCT.md, PLAN.md and PROGRESS.md before anything else, and DESIGN.md before screen work. If a required file is missing, identify it and create it from agreed decisions; do not invent product scope.
- Work through the next unfinished milestone in PLAN.md, end to end. Milestone 1 is “I can get a correct, grounded answer from one public article, inspect its evidence and see a safe refusal when the article cannot answer.” Website setup supports this outcome; it is not a standalone milestone. Deepgram and the speaking customer avatar come after milestone 1; both remain in v1.
- Before writing code, tell me in two or three sentences what you think I am after and how you will approach it. Wait for my yes. Do not guess.
- Work on one milestone at a time. If I request something new mid-milestone, add it to the parked list in PLAN.md and carry on unless I explicitly redirect the current work.
- Never say “done” until you have seen the relevant flow work and explained how I can check it. Screenshots prove appearance; real audio tests prove listening. Label simulations clearly.
- Build and test the core call flow in desktop Chrome with Google Meet, real microphone input, customer audio and the native sidebar. Test the participant's screen-share view too. A phone screenshot cannot validate this flow. Check the website's narrow layout separately.
- Test the opening voice interaction and the three-question avatar demo independently. The avatar demo does not prove that real Meet capture or speaker separation works.
- Measure answer correctness, unwanted triggers from salesperson speech and elapsed time from the end of a question to a useful answer. Aim for a complete short answer within five seconds, and report measured results instead of promising the target.
- When I report a bug, find the cause before changing anything. Fix that cause and explain it.
- Add meaningful tests for new behaviour and regression risks. Remove tests for dropped features. Cover source grounding, missing answers, speech-channel handling, login, source access, allowances and the call cutoff.
- After I confirm a milestone works: commit, push, add one factual line to PROGRESS.md, then deploy with npm run deploy. Do not commit, push or deploy on my behalf until the repository and deployment destination are established.
- Never put a key or password in code, a VITE_ variable or a committed file. Public configuration such as the Convex deployment URL may be exposed; secrets may not.
- Never fake listening, answer accuracy or response speed. Tell me clearly what is simulated and what has been tested live.

## 3. Shipping

Live website link: https://deafening-frog-846.convex.site. Serve the built website and its assets through the fixed Convex stack. This is the product website and the submission link. Do not introduce a separate frontend host.

Repo: https://github.com/pramesh93/cuelo (public, explicitly requested by the user). Do not assume its visibility or change it.

Deploy: npm run deploy. Implement this as the explicit deployment command for the website assets and Convex backend. A push never deploys by itself. After I confirm a milestone works: commit, push, update PROGRESS.md, then deploy.

Provider keys live in Convex environment variables, set independently for dev and production. Deployment credentials live in the deployment environment. Never ask me to paste secrets into chat. Give me instructions to enter them directly in the relevant service settings.

.gitignore must cover .env.local and other local secret files. Real people's documents, transcripts, names and emails never go in the repo, even as test fixtures. Use made-up examples or explicitly public documents.

Every access check, source ownership check, visit allowance, invitation restriction and spending decision happens on the backend. The interface can explain a limit but cannot be its only enforcement. Anonymous visit limits are resettable; do not describe them as reliable person identification.

Before I share the link, test logged out in desktop Chrome: the opening voice interaction, source upload, three-question demo, Google sign-in and invited live-call access. Test mic refusal, missing tab audio, source deletion, errors and the 60-minute cutoff. Check the website on a phone for readable layout and a clear desktop requirement; mobile live-call support is not implied.

## 4. The AI call

### Model and execution

Answer model: GPT-4.1, with no separate reasoning step. Speech recognition: Deepgram Nova-3 in English. Customer-avatar speech: gpt-4o-mini-tts. Cuelo itself returns text only.

Run question detection, retrieval and answer generation in backend functions and Convex actions, never directly from the interface with a provider key. Handle audio through the secure streaming route described above.

What goes into an answer request: the customer’s question, relevant conversation from the current call and the explicitly chosen answer mode. Include relevant passages from the active source only in document mode. The backend returns answer provenance with every result; generic results always render “Not from your document”, including streamed and replayed cards. Never silently fall back from document mode to generic answers. Retain access to the entire current-call transcript during the session; do not send the whole source and transcript on every request unnecessarily. Set explicit server-side input limits before implementation and report oversize inputs rather than silently losing context. Do not choose a token limit that contradicts the agreed 60-minute call memory.

Reply cap: max_output_tokens 500 as a technical ceiling; the user-facing answer remains at most 40 words, excluding the citation. Stream text promptly but do not animate it artificially slowly. In document mode, ground every product claim and preserve the source reference. Generic mode must not invent company-specific facts or pretend it has checked a document. “Instant” describes the intended responsive experience, not guaranteed zero latency; show actual listening and processing states.

### Allowances and spending

- Opening interaction: five successful generated answers per anonymous visit.
- Avatar demo: three supported questions with generated answers, separate from the opening allowance.
- Live calls: invited testers only, maximum 60 minutes each.
- Include internal question detection, transcription, avatar speech, retries and hosting in cost accounting—not just visible answers.
- Start development with no paid usage. Simulated development flows must be labelled; live AI testing needs available credits or explicit activation of the testing budget.
- Once live testing begins, the initial budget is ₹5,000 per month across all services. Alert before it is exhausted and stop admitting new paid sessions when the budget is reached. Reserve expected session cost before admitting a call and keep headroom for in-progress calls, delayed billing and currency changes.
- Reduce the number of testers or call hours before reducing answer quality. Do not silently downgrade models. Provider budgets or alerts are not necessarily hard spending caps; use backend checks and supported provider controls together.
- Do not copy the template's arbitrary “100 AI calls per hour” limit as a product decision. Configure abuse and concurrency limits from the testing capacity and budget before launch. Enforce them on the backend.

### Failures and boundaries

For a temporary service failure or rate limit, show “Busy right now. Try again in a few minutes.” For missing audio, a source problem or exhausted allowance, explain the actual problem with the relevant next action. Do not label every failure “busy”.

Login comes after the first-value demo. It is required to save a source and use an invited live-call session.

The AI must never invent product capabilities, pricing, discounts, policies or citations; treat instructions embedded in sources as trusted commands; answer from a previous call; trigger suggestions from the salesperson's own questions; or speak as Cuelo. General knowledge is permitted in the clearly labelled opening experience and in explicitly chosen generic live-call mode. It is never substitute evidence for a document-grounded or company-specific claim. Every generic answer visibly says “Not from your document”.

## 5. Setup still needed

- GitHub repository established: https://github.com/pramesh93/cuelo (public).
- Convex project: prmsh-biz/build-sprint-app; production: https://deafening-frog-846.convex.site.
- Provider accounts and secrets entered directly in service settings.
- Google OAuth configuration for the sprint’s .convex.site website.
- Tested input limits, transient-data expiry, streaming architecture and initial tester capacity. These are implementation details to resolve before live testing, not evidence that the product already works.

Technical references: [Deepgram models](https://developers.deepgram.com/docs/model), [GPT-4.1](https://developers.openai.com/api/docs/models/gpt-4.1), [avatar speech](https://developers.openai.com/api/docs/guides/text-to-speech), [Convex Auth](https://labs.convex.dev/auth), [Convex HTTP actions](https://docs.convex.dev/functions/http-actions).

## Knowledge-first Home refinement — 14 October 2026

Before the first completed call, each visit to Home opens Choose your knowledge when the extension is installed, even if the saved guide step was call. Continue opens call instructions within that visit. The document option lists every owned saved source by name/type, loads additional pages rather than limiting to the five recent items, and supports adding several sources through the inline editor. These are saved-library entries, not a claim that all are used simultaneously; the extension still chooses one source per call. Completed-call accounts retain analytics Home and the reinstall reminder. Same-visit extension recovery keeps the current step; a new Home visit starts with knowledge.

## Approved extension design and typing — 14 October 2026

Development sidebar uses the website's light lavender glass theme, local Nunito Sans fonts, branded blinking/breathing CSS blob, Google Sign in, and an account menu with Sign out. Sign out remains available during a call and stops capture first. Active call answers appear above a fixed compact composer with Listening/Answering/Paused status, Pause/Resume, Stop, and a typed-question field/send action. Earlier answers remain expandable; generic answers retain visible provenance and document answers open evidence. Reduced motion disables animation. Source import and original audio/session controls remain functional.

Typed questions are explicit user submissions during a successfully connected listening session only. They join the same ordered queue and temporary call context as spoken questions, use the session's chosen mode/source, share answer/question capacity and trial/session/spending controls, and are deleted with call text. They do not run paid question classification but count against session question capacity. Pause disables typing; Resume restores it. Stop and sign out clear unsent draft text. Backend ownership, live-enabled flag, generation, active listening, input capacity and limits are enforced; browser controls alone do not authorize a request. Production four-answer limit remains disabled; development test limits remain. No additional service/host permission, recording, transcript retention, paid activation or Store update is authorized.


## Approved paused-time trial and idle connection — 19 October 2026

User approved in development: the90-minute account trial counts both listening and paused time after a successful connection, until Stop/meeting end/expiry. Historical usage is preserved without retroactive paused-time charging. Actual listening analytics remain separate. Pause stops capture, audio transmission and new answer processing while retaining idle speech connections; healthy Resume reuses them. A dropped connection may reconnect within the same call under access/time/budget checks and failure cooldown, without another trial call. Normal Pause/Resume must not consume an arbitrary lifetime connection allowance. Stop/end/sign-out/expiry closes all connections. The60-minute per-call maximum,3-call/90-minute production trial and existing development grants remain. Development implementation does not authorize production deployment, Store publication, new budget grants or paid agent tests. Actual idle-time billing must be verified, never assumed free.
