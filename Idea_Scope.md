## Current implementation — 16 October 2026

Read [CURRENT_STATE.md](CURRENT_STATE.md) for the current approved behavior, test evidence, exhausted development allowance and release blockers. It supersedes conflicting older implementation notes below; unchanged policies and approval requirements still apply. This is a development GitHub checkpoint, not authorization to deploy, publish or enable further paid testing.

## Approved signed-in workspace — 14 October 2026

## Approved source selection and unified branding — 14 October 2026

This supersedes the older one-source-per-call restriction for extension calls. The panel uses a searchable multi-select dropdown with a closed selected-count, tick-mark options, Selected only review/removal and Done. Keep selections compact; no checkbox row clutter or outside tags. Up to 20 owned saved sources and 1,000,000 combined text characters per call are the explicit server input bounds; excessive selections are refused clearly rather than truncated. Reject empty, duplicate, excessive, missing, expired or foreign selections before spending admission. Legacy single-source API callers remain supported. Generic mode accepts no source selection. Sources are frozen for the active/paused session; each selected source is protected from website replacement/deletion, including secondary and legacy sources. Stop/expiry removes selection links and temporary text; saved content remains.

Document answers retrieve across selected sources with unique passage IDs and server-supplied document identity, retain 40-word/evidence/input limits, label each supported bullet with its actual source/reference and open the exact supporting passages. Conflicts are reported rather than silently choosing a source or falling back to generic answers. Both spoken and typed requests share this path. Multi-source quality is not established by simulated tests alone.

All content management stays on the website: panel Manage content opens the correct environment's Content page in a new tab; no embedded SourceManager remains in the panel. Source subscriptions update as saved content changes. One shared CueloWordmark and brand.css provide identical Nunito Sans font, size, weight, spacing and geometric round purple dot across landing, sign-in, Home, onboarding and extension. Development manifest now reuses approved blob icons. Chrome controls its outer grey header/close button; do not promise to recolour browser-owned UI. Retain the development label; published name is Cuelo. Development work only; no production/Store release or paid activation is authorized.


## Onboarding refinements — 14 October 2026

Detected installation skips Get Cuelo directly to Choose your knowledge, with a completion tick and no active installation link. Remove Check extension and the account-sharing sentence from this guide. Use my content opens the existing save/cancel content editor inline; saving leaves the user on step 2, with the saved source available in Content and the extension. The call step offers Google Meet, disabled Zoom and Microsoft Teams, and only two instructions: start/join the call, then open Cuelo; further setup happens in the extension. Preserve backend completion-based analytics unlocking and trial totals. Detect extension removal on Home: accounts with completed calls keep analytics, trial allowance and sidebar visible, with a reinstall reminder above the analytics; the reminder disappears automatically on reconnection. Before the first completed call, show the restore screen and resume the saved guide position after reconnection. Never replay onboarding for an account with completed calls. Development installation prompts identify the development extension instead of linking to the production Store package. Content/Profile stay accessible. This remains development-only, with no paid activation or Store/production update.


## Approved onboarding addition — 14 October 2026

Add a one-time role/company form and a guided first-call Home before analytics, with Chrome installation, disabled Mac/Windows choices, optional content, and Meet/side-panel instructions. Keep the account trial visible from the start. Require sign in before first call and unlock analytics only after a successfully connected call ends; Pause/Resume remains one call. Preserve both website-first and extension-first paths. Role/company are saved for future V2 personalization only. No guest-call identification, integrations, transcript retention, production activation or store update is included.


Signed-in website users land on Home in a light lavender glass workspace. Sidebar: Cuelo branding, Home, Content; Activity, Insights and Integrations disabled. Account menu: read-only Profile (Google name/email), disabled Settings/Contact us/FAQs and working shared Sign out returning to the public landing page. Content supports multiple named saved sources (pasted text, public page, PDF/Word), newest first, search/type filter/sort, add/edit modal with Save/Cancel and delete confirmation. Preserve existing saved sources; one explicitly selected source per call remains. Editing/deleting a source used by an active or paused call requires stopping that call first.

Home shows recent saved content and completed-call dates, listening durations and delivered-answer counts, aggregate totals and account trial remaining. No call transcripts, answer text, audio or AI conversation summaries are retained. This approved date/count-only call history supersedes older blanket no-history rules; v2 conversation transcripts/analysis remain parked. New recording begins with this update; do not fabricate historical call totals. Account isolation is enforced on the backend. Update privacy disclosures before publishing this behavior. Work is approved in development only; production deployment, store update, commit and push require separate approval.

## Approved account trial — 13 October 2026

This update supersedes older invitation-only live-call rules. Any Google-signed-in account may use up to three successful live calls or 90 minutes of active listening, whichever comes first, subject to the existing service availability and spending safeguards. Existing historical test calls do not consume the new trial. Trial ownership, call counts, listening time and admission are enforced on the backend per account across devices. Failed starts do not consume trial calls. Pause excludes listening time; Resume/reconnect continues the same session without another call charge. The existing 60-minute maximum per session remains. Stop, Meet departure and expiry settle time and delete temporary call text; only account usage totals remain. On trial exhaustion, capture and new answers stop, existing answers remain visible in the current sidebar, and paid-plan availability is explained without a purchase button. Sign-out clears these retained answers.

The landing page keeps its existing website question limits and replaces its document link with “Try Cuelo on a call” beside “Speak to Cuelo”. The chooser shows Windows and Mac as coming soon, and links to the Chrome Web Store only when the actual published listing is configured. No listing currently exists, so Chrome also honestly shows coming soon. Google signup/sign-in is required before a live call; website/sidebar share the account. No invitation workflow remains. Publishing the store listing, activating paid/live provider settings, committing, pushing and production deployment require their own approval.

# **IDEA LOCK · Build Sprint**

## Approved landing-page update — 12 October 2026

This update supersedes older opening-demo wording and allowances only; live-call behaviour remains unchanged. Keep the existing landing-page visual identity. Add Features, About us and Pricing section links with Sign up/Log in on the right. Hero sentence: “Less digging through documents. More confidence answering questions on every call.” Opening card: “Try Cuelo.” / “Ask a question out loud. Get a short answer here.” Remove “Not from your document” from the landing experience at the user’s explicit request; retain document evidence and existing live-call provenance. Remove dragging/reset controls. The opening microphone captures one question, returns text and switches off; optional document selection stays on the landing page.

Logged-out visitors may submit three questions per India calendar day, counted at paid admission (including subsequent provider failures). Permission refusal, cancelled/invalid audio and disabled/budget-denied admission do not consume a daily question. Do not show the attempt count or reset time before use. At exhaustion retain the answer and show only “Log in to keep using Cuelo.”; never navigate automatically. Use a persistent random browser capability and atomic server checks so refreshes, tabs and windows in the same browser profile share the allowance. This cannot reliably identify someone after storage deletion, in private browsing or across profiles/devices. Temporary-source capabilities remain separate and ephemeral. Signed-in trial allowance is not yet agreed; keep existing invited live-call setup and do not grant additional paid access by assumption. No pricing figures or customer/database integrations may be invented.


## **The idea, in one line**

**AI that listens to my sales call and tells me what to say next in 3 bullets.**

## **Why me**

I have been in B2B SaaS sales for the last 6 years across Atlassian, Salesforce and BrowserStack.

I spend a large part of my job speaking with prospects and customers—discovery calls, demos, POCs, negotiations, objections and account conversations.

I have personally been in situations where a customer asks something unexpected, raises an objection, mentions a competitor or challenges the value/price, and I have only a few seconds to decide how to respond.

I also know other salespeople who can test this privately with me.

My advantage is simple: **I am the user. I have spent years inside this workflow and can immediately tell whether the suggestions are useful or generic.**

---

# **GOAL**

## **The one goal they hire it for**

**Help me respond better during a live customer conversation without stopping to think, search or ask someone for help.**

The primary value is **money** because better conversations can help progress and close deals.

There is also a strong **confidence/status** benefit: I want to sound prepared even when the customer takes the conversation somewhere unexpected.

---

## **Delta 4**

### **Today**

**1\. Listen**

Customer says something or asks a question.

**2\. Think**

I quickly try to understand what they actually mean and what I should say.

**3\. Search / improvise**

If I know the answer, I respond from experience.

If I don't, I improvise, search notes, message someone internally, promise to come back later, or give a weak answer.

**4\. Respond**

I say whatever I can come up with in those few seconds.

### **With my product**

**1\. Listen**

The AI listens to the customer with me.

**2\. Understand**

It understands the latest question, objection or concern in the context of the conversation.

**3\. Suggest**

Within a few seconds, I see **3 short bullets** telling me how I could respond.

**4\. Respond**

I glance at the bullets and answer naturally in my own words.

So the product reduces:

**Listen → think → search/improvise → respond**

to:

**Listen → glance → respond.**

---

## **The sin it rides**

**Fear / insecurity.**

Salespeople don't want to look unprepared in front of customers.

When someone asks a difficult question on a live call, I want something beside me saying:

> **Here's how you can handle this.**

---

# **USER**

## **The trigger**

The user is a **B2B salesperson on a live customer/prospect call**.

The pain hits when the customer:

* asks a difficult question;  
* raises an objection;  
* compares competitors;  
* challenges pricing;  
* describes a problem the rep doesn't fully understand;  
* asks about an unfamiliar capability;  
* or says something where the salesperson isn't sure what to ask next.

The exact moment is:

> **The customer finishes speaking and I have only a few seconds to respond.**

---

## **Today's path, step by step**

1. Customer says something unexpected.  
2. I listen and try to understand what they really mean.  
3. I mentally search through what I know.  
4. I may look through notes or documentation.  
5. I may message a solutions engineer or colleague.  
6. I may give a generic response.  
7. I may say, “Let me check and come back to you.”  
8. Sometimes I simply improvise.

Or I don't solve it at all.

I move the conversation forward without giving the best possible response and realize afterwards:

> **“I should have said/asked that.”**

---

## **Who they trust on this decision**

Salespeople currently trust:

* their own experience;  
* managers;  
* experienced AEs;  
* sales engineers / solution engineers;  
* internal product experts;  
* sales playbooks;  
* product documentation;  
* tools such as ChatGPT before or after calls.

For my product to be trusted **during the call**, suggestions have to be:

**fast \+ short \+ relevant \+ accurate.**

A beautiful answer appearing 20 seconds later is useless.

Three useful bullets appearing while I still have time to respond are valuable.

---

## **Would they pay?**

Yes, sales teams already pay for sales intelligence, conversation intelligence, call recording, coaching and AI sales tools.

But the pricing hypothesis for my product needs to be tested.

My starting guess:

**₹999/month per salesperson**

or roughly:

**\$10–15/user/month.**

For the sprint I care less about proving the perfect price and more about answering:

> **Would a salesperson actually use this during a real call, and would they miss it if I took it away?**

---

# **PRODUCT**

## **Onboarding**

The first experience should require almost no setup.

### **Step 1**

User opens the product.

### **Step 2**

They click:

> **Start Copilot**

### **Step 3**

The product starts listening.

### **Step 4**

Someone says:

> “Your competitor is 30% cheaper. I don't understand why we should pay more for your product.”

Within a few seconds, the salesperson sees:

**Suggested response**

* Don't defend the price immediately—find out whether price is actually the deciding factor.  
* Ask: “If pricing were equal, what would make you choose between the two products?”  
* Use their answer to move the discussion from price to business value and differentiation.

The user should understand the entire product within **one conversation**.

---

## **The core loop**

### **User story 1**

As a salesperson, I click one button before my customer conversation and the copilot starts listening.

### **User story 2**

As a salesperson, when the customer asks a question or raises an objection, I see a useful response within a few seconds.

### **User story 3**

As a salesperson, I receive **only three short bullets**, so I can glance at them without losing attention on the call.

### **User story 4**

As a salesperson, the suggestions change as the conversation changes rather than treating every sentence independently.

### **User story 5**

As a salesperson, I use the suggestion as guidance and respond naturally rather than reading an AI-generated paragraph to the customer.

The core loop is:

**Customer speaks → AI understands → 3 bullets appear → I respond → conversation continues.**

---

## **Coming back**

I use it on every important customer call.

Over time, the product could understand:

* what I sell;  
* my product capabilities;  
* pricing;  
* competitors;  
* common objections;  
* previous customer conversations;  
* my preferred sales style.

That should make its suggestions increasingly specific.

But this is **not required for the first Build Sprint version**.

---

## **The AI-first part**

AI is the **core loop**.

The product has to simultaneously understand:

**speech \+ conversation context \+ customer intent \+ objection/question \+ useful next response.**

This isn't:

> record call → summarize afterwards.

The value exists **while the conversation is happening**.

The critical technical metric is therefore:

> **How quickly can useful bullets appear after the customer finishes speaking?**

For the sprint, I want to test whether:

**live audio → transcript → useful 3-bullet response**

can happen quickly enough that I can actually use the answer before I need to speak.

---

# **MARKET**

## **Tailwinds**

Sales calls are already becoming AI-assisted.

Companies pay for:

* conversation intelligence;  
* call recording/transcription;  
* sales coaching;  
* AI SDRs;  
* meeting assistants;  
* sales enablement;  
* real-time battlecards and objection handling.

AI models are also becoming fast enough for real-time speech and reasoning, which makes assistance **during the conversation** increasingly practical rather than limiting AI to before/after the call.

The timing hypothesis is:

> **Sales AI has spent years analyzing what happened after calls. The next opportunity is helping the salesperson while the conversation is actually happening.**

---

## **Competitors**

This is **not an empty category**.

Products already exist around real-time sales assistance, conversation intelligence and live coaching.

That means:

> **“AI listens to sales calls” is not enough differentiation.**

For the sprint, I want to learn whether the extremely simple interaction:

> **Customer speaks → salesperson gets exactly 3 useful bullets**

is fast and useful enough to become something salespeople genuinely keep open during calls.

The flows I want to study from competitors are:

* how they capture live call audio;  
* how quickly suggestions appear;  
* how much text they show;  
* whether suggestions are generic or product-specific;  
* how they handle objections;  
* whether the rep needs to interact with the UI during the call;  
* whether they work across Zoom/Meet/Teams or require a specific meeting platform.

I have **not yet captured competitor screenshots**, so I should not pretend this section is complete. That is a research task before I build the UI.

---

## **Size and fit**

For the sprint, my user is:

> **B2B salespeople who regularly speak with prospects/customers over video or voice calls.**

This is significantly closer to my network than my previous HubSpot implementation idea.

I have worked in B2B SaaS sales for six years and know many people working in sales.

Immediate testers I can already identify include:

* **AV — salesperson at a technology company**  
* **myself — B2B SaaS Account Executive**  
* **other current/former sales colleagues I can contact privately**

I should now write down **at least 10 actual salespeople I can message**, rather than saying “I know many salespeople.”

Finding **200–300 potential users in relevant groups/communities** should also be substantially easier than finding 200–300 Heads of Implementation because B2B sales communities are much larger.

**Current confirmed count: 2 named users \+ myself.**

The next distribution task is to turn “many other salespeople” into an actual list of 10 people and identify at least one community containing 200–300 relevant salespeople.

---

# **The sprint version**

I am deliberately **not** building:

* CRM integration;  
* automatic CRM updates;  
* post-call summaries;  
* email follow-ups;  
* sales analytics;  
* manager dashboards;  
* deal scoring;  
* automated customer responses;  
* a complete sales platform.

For the Build Sprint, the product does **one thing**:

> **Listen to a live sales conversation and show the salesperson 3 useful things to say next, fast enough to use them.**

The proof is simple:

**A salesperson has a conversation they haven't scripted → customer raises a fresh question/objection → the product produces useful bullets before the salesperson needs to answer.**

If that doesn't work reliably and quickly, nothing else matters.



---

# Cuelo v1 scope

Approved release update on 6 October 2026, summarising AGENTS.md, PRODUCT.md, DESIGN.md and the user's approved v1 release plan. Earlier exploration above is preserved. These are requirements, not claims that the flows work.

Cuelo helps salespeople answer customer questions during an English Google Meet call in desktop Chrome. It quietly displays short text answers in the approved native Chrome sidebar (8–10 October revision). The customer audio and salesperson microphone are separate inputs; salesperson speech supplies context but never triggers answers.

## Required release

- Opening voice experience before login: five successful generated answers per visit, source choice, visible "Not from your document" for general knowledge.
- Separate practice call: sample or one supplied source, exactly three supported spoken customer-avatar questions, answers generated from audio rather than a prepared answer key.
- Google-only Convex Auth; anyone can sign up, invited testers alone can start real calls.
- Explicit generic/document mode at signup continuation and again before listening. One PDF, Word document, pasted text or public webpage; uploads at most 10 MB/50 pages, no OCR or whole-site crawling.
- Customer-question detection, continuous listening while answering, independent ordered questions, fresh answers for repeats and evidence inspection. Document mode safely refuses missing or conflicting evidence. Generic mode never pretends to verify company facts.
- Full temporary current-call transcript, no earlier calls, recordings or answer history; cleanup at session end and expiry for abandoned sessions.
- Native sidebar with truthful state, Pause/Resume, Stop, retained earlier answers and a same-screen test-limit notice. Background tab/window switches must not stop listening.
- 55-minute warning and page-controlled 60-minute stopping; real cutoff test is deferred. Independent provider shutdown is parked; no browser-freeze stopping guarantee. Meet continues.
- Approved Nunito Sans, warm off-white/charcoal/violet design; original listening blob and illustrated customer; readable narrow layout with desktop requirement.
- Backend ownership, allowances, invitations and cost reservations; initial aggregate monthly budget ₹5,000. No new paid test allowance without explicit approval.
- GitHub https://github.com/pramesh93/cuelo and Convex https://deafening-frog-846.convex.site. Deploy explicitly with npm run deploy after user confirmation.

## Parked by the user

Extended performance testing, five-second optimisation and the OpenAI/Deepgram comparison. Preserve GPT-4.1 and Deepgram Nova-3 unless a provider change is separately approved. Report actual delays honestly.

Desktop apps, mobile live calls, guaranteed screen-share invisibility, OCR, CRM/private database integrations, recordings, call history and summaries remain outside v1.

## Outstanding release dependencies

Production configuration/capacity review, remaining source/error/provenance verification and deferred context/cutoff tests. Independent enforceable provider shutdown is parked under the restricted v1 approval. No extra service is authorised by the release-plan approval.

## Knowledge-first Home refinement — 14 October 2026

Before the first completed call, each visit to Home opens Choose your knowledge when the extension is installed, even if the saved guide step was call. Continue opens call instructions within that visit. The document option lists every owned saved source by name/type, loads additional pages rather than limiting to the five recent items, and supports adding several sources through the inline editor. These are saved-library entries, not a claim that all are used simultaneously; the extension still chooses one source per call. Completed-call accounts retain analytics Home and the reinstall reminder. Same-visit extension recovery keeps the current step; a new Home visit starts with knowledge.

## Approved extension design and typing — 14 October 2026

Development sidebar uses the website's light lavender glass theme, local Nunito Sans fonts, branded blinking/breathing CSS blob, Google Sign in, and an account menu with Sign out. Sign out remains available during a call and stops capture first. Active call answers appear above a fixed compact composer with Listening/Answering/Paused status, Pause/Resume, Stop, and a typed-question field/send action. Earlier answers remain expandable; generic answers retain visible provenance and document answers open evidence. Reduced motion disables animation. Source import and original audio/session controls remain functional.

Typed questions are explicit user submissions during a successfully connected listening session only. They join the same ordered queue and temporary call context as spoken questions, use the session's chosen mode/source, share answer/question capacity and trial/session/spending controls, and are deleted with call text. They do not run paid question classification but count against session question capacity. Pause disables typing; Resume restores it. Stop and sign out clear unsent draft text. Backend ownership, live-enabled flag, generation, active listening, input capacity and limits are enforced; browser controls alone do not authorize a request. Production four-answer limit remains disabled; development test limits remain. No additional service/host permission, recording, transcript retention, paid activation or Store update is authorized.
