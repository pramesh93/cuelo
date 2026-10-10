# PRODUCT.md — Cuelo live-call answer assistant

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

1. Open Cuelo before or after joining Meet in the same Chrome window. Sign in with Google from the sidebar if needed. The accepted temporary Google sign-in window presentation is parked for improvement; no persistent Cuelo website tab is required.
2. Explicitly choose generic answers or answers from one document. Generic needs no source. Document mode selects the saved source or imports a new one in the sidebar. Full source inspection/replacement/deletion remains available on the website.
3. Click Start once. Meet-page customer audio and separate salesperson microphone input are checked before paid admission. No tab-sharing picker, floating window or target-tab toolbar capture grant.
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
