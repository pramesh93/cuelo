# DESIGN.md

Read this before building or changing any screen. If a choice isn't covered here, ask me instead of guessing.

Product: Cuelo. This file records the approved design direction. It is a specification, not evidence that the product has been built or tested. Preserve the browser-only platform and three-question source-based practice flow. Real calls offer an explicit generic/document choice. PLAN.md stages Deepgram and the speaking avatar after milestone 1; this does not remove them from v1. Milestone 1 proves grounded answers from a public article. Its evaluation interface must not pretend to be a working voice demo.

## 1. The feeling, in labels

Intriguing · visibly alive · friendly · calm · trustworthy · rounded · crisp · uncluttered.

Cuelo is a quiet assistant: the user speaks and Cuelo responds only in text. The customer avatar speaks during practice. Cuelo itself never speaks, plays notification sounds or interrupts a real call.

Use warm off-white, charcoal text and soft violet. Give the blob personality through subtle shape changes and listening movement. Trust comes from clear mode labels, truthful audio status and evidence, not decorative confidence scores.

## 2. References, one per component

These are references chosen by the user. “Take” describes the intended inspiration, not permission to duplicate artwork, source code, copy or branding. Motion must be inspected in the live reference before implementing it; extracted webpage text alone does not establish animation behaviour.

[Navigation]: https://fluence.framer.website/
Take: the user's observed top navigation compression during scrolling; smoothly reduce its height and visual footprint while keeping controls readable.
Ignore: the brand, marketing claims, colours, unrelated sections and exact geometry.

[Typography and spacing]: https://cred.club/
Take: the user's preferred crisp hierarchy, generous space and polished presentation; translate this into Cuelo's rounded, friendly typography.
Ignore: the exact font, brand styling, financial messaging and wholesale layout duplication.

[Motion and media]: https://cred.club/
Take: the user's preferred considered transitions and well-composed media; use original Cuelo assets and much quieter motion.
Ignore: elaborate effects that delay interaction, full-screen promotional videos and animation for its own sake.

[Listening blob]: user's reference to the ChatGPT mobile voice listening shape.
Take: soft, responsive movement that makes listening understandable, with distinct idle, listening and working states.
Ignore: exact silhouette, colours and voice output. This is a behaviour reference; no screenshot was supplied. Build an original character.

[Customer avatar]: original Cuelo illustration; no external image reference selected.
Take: a simple cute illustrated person, friendly expression, subtle speaking expressions and attentive listening between questions.
Ignore: photorealism, uncanny movements, exaggerated reactions and game-like rewards.

[Call invitation]: original Cuelo component.
Take: a spacious, softly rounded invitation surface with a small call symbol and a violet circular arrow at one end. Set “Experience Cuelo on a call” as a calm typographic invitation rather than a conventional long filled button. The whole surface is an accessible button.
Ignore: supporting text underneath, extra badges, pulsing borders and competing actions.

## 3. Type and colour

Font: **Nunito Sans** throughout. Rounded and friendly, with clear answer text. Weights 400 for prose, 600 for controls, 700 for headings. Do not claim it is CRED's font.

Sizes: four roles only.

| Role | Size | Use |
| --- | --- | --- |
| Hero | 48px desktop; 32px narrow screens | Opening headline |
| Section | 28px | Section and screen headings |
| Reading | 18px | Answers, instructions, paragraphs and main actions |
| Supporting | 14px | Source, status, progress, field labels and errors |

Reading line height: 1.5. Keep answer lines short enough to scan. Never shrink answer text to fit a crowded card.

Colours: charcoal **#25232B** on warm off-white **#FAF8F5** · main-action violet **#7357C8** with white text · errors **#B42338**.

Secondary text: **#64606C**. Card surface: **#FFFFFF**. Border: **#E4DFEA**. Decorative blob: pale violet **#E9E1F8**, with muted violet shading **#C8B5E8**. Use the stronger accent only for the current main action; no violet-filled secondary buttons or decorative headings. Check text/focus contrast during implementation.

Cards have soft corners, a fine border and a restrained shadow. No glass effect behind answer text. Controls have visible focus and at least 44px hit areas. Use a light theme for v1; do not add a theme switch without asking.

## 4. Screens

### Website opening: for a first conversation with Cuelo

Top to bottom: compressing navigation (Cuelo, Log in) → approved headline → one explanatory sentence → visible blob and answer panel → microphone action and voice instruction → clear knowledge-mode label and quiet source option. The blob and speaking option fit within the first desktop viewport. No feature grid, testimonials or call-demo shortcut in this area.

Main action: **“Speak to Cuelo”** → microphone permission, then voice input. Active state: **“Listening — tap to finish.”** Cuelo's replies appear as text; there is no typed-question input in this opening experience.

Panel welcome: **“Ask me anything.”** Instruction: **“Tap the mic and speak. I’ll reply in text.”**

Mode label without a source: **“General knowledge.”** Every generic answer card must also display **“Not from your document”** in plain sight, next to the answer. Use readable supporting text with normal contrast; never hide it in a tooltip, collapsed source area or tiny disclaimer. The landing blob is a demo, not a connected call. Source invitation: **“For product-specific answers, add a document or help-page link.”** When a source is selected, show its filename/title and ground replies in it; do not silently blend unsupported general knowledge into source-based answers.

Empty: “Ask me anything.” · Loading: “Thinking…” · Error: “I couldn’t hear you. Please try again.” · Done: display the answer; return the mic to an explicit ready state rather than secretly listening.

Permission error: “Microphone access is off. Allow it in your browser to speak to Cuelo.” Service error: “I couldn’t answer that just now. Please try again.”

Opening limit: five generated Cuelo answers. Fixed welcome copy and predefined scrolling prompts do not count. The practice demo has its own three-answer allowance and stays accessible when the opening limit is reached. Count completed generated answers; unsuccessful attempts do not consume a turn. Show remaining answers unobtrusively. At five, replace the opening mic action with **“Sign up to keep talking”** and explain “You’ve used your five free answers.” Never force navigation away from the page.

### Scroll journey and call invitation: for reaching the core demo

Smooth native scrolling; no scroll hijacking, snapping or long pinned sequences. The demo lives further down the page. On first arrival, show one predefined blob hint: **“Try me on a customer call. Use a sample, or add your own document.”** Show it in the blob's bubble, not as text beneath the invitation. Do not claim support for any database.

Main action: **“Experience Cuelo on a call”** → practice setup. No subtitle under the invitation.

Empty: “Experience Cuelo on a call” · Loading: “Opening your practice call…” · Error: “The practice call couldn’t open. Try again.” · Done: open setup.

Blob movement: for the first 20 seconds on the page, follow a planned scroll-aware path that never crosses text, buttons, fields or answer content. Stop positional motion during voice interaction. After 20 seconds, enable dragging and show once: **“Drag me somewhere comfortable.”** After manual placement, stop automatic repositioning. Dragging moves the blob and attached answer card together. Clamp to the viewport and provide a Reset position control; dragging must not prevent scrolling or clicking controls.

### Practice setup: for choosing the answer source

Top to bottom: “Practice call” heading → “Try with a sample” and “Upload my document” choices → optional help-page link input → selected-source summary → microphone status → start action.

Main action: **“Join practice call”** → three-question virtual call.

Empty: “Choose a sample or add your product document.” · Loading: “Preparing three customer questions…” · Error: “This source doesn’t contain enough clear information for three questions. Try another source or use the sample.” · Done: “Your practice call is ready.”

Do not ask for login, Google Meet link or CRM access before practice. Explain upload retention/deletion clearly. Accept PDF, Word documents, pasted text and one public webpage link. Uploads: up to 10 MB and 50 pages, readable text only; no OCR in v1. Guest sources are temporary and deleted at session end with expiry cleanup for abandoned sessions. Signed-in sources stay until replaced or deleted.

### Virtual call: for experiencing listening, speed and source accuracy

Top to bottom: practice label and progress “Question 1 of 3” → friendly customer avatar beside Cuelo answer panel → section/page then source name last, and measured response time → microphone, Pause, Stop and Next question controls.

The avatar asks exactly three supported questions aloud, listens while the user responds and asks the next when they finish. Use an explicit microphone turn boundary to avoid guessing that a pause means finished; “Next question” also lets the user move on without speaking. The last question ends at the completion state, not a fourth question.

Cuelo generates its answers live from the source after recognising avatar audio. No preloaded answer cards or passing the avatar's prepared answer directly to the assistant. Cuelo remains quiet for the user's own speech. There is no deliberately unanswered-question case in onboarding; keep safe-failure tests outside the demo.

Main action during turn: **“Next question”** → next of three questions. At completion: **“Sign up / Log in”** → account screen.

Empty: “Your customer is ready.” · Loading: “Finding the answer…” · Error: “I missed that question. Replay it to try again.” · Done: “Ready for your next call? Sign up and add Cuelo to a call.”

Welcome text may type gently. Answers render as soon as available, with no artificial character-by-character delay. Source details remain inspectable. The avatar never claims success when audio or retrieval has failed.

### Account screen: for continuing after first value

Top to bottom: “Add Cuelo to your next call” → “Continue with Google” (the only sign-in method) → “How should Cuelo answer?” → two clear choices: **“Generic answers”** and **“Answers from my document”**. Generic helper: “General knowledge. Not from your document.” Document helper: “Answers grounded in one source you add.” Only the document choice opens the source step. Keep these as steps in the continuation flow so the screen stays calm.

Main action: **“Continue”** → for generic mode, Google Meet setup; for document mode, add or confirm a source, then Google Meet setup. Never require a document in generic mode. Saved documents do not silently change the selected mode.

Empty: “Sign up or log in to continue.” · Loading: “Signing you in…” · Error: “We couldn’t sign you in. Please try again.” · Done: “You’re in. Let’s connect your call.”

### Google Meet setup: for connecting the real call

Top to bottom: Meet link field → visible answer-mode choice (“Generic answers” / “Answers from my document”) → add, confirm or replace source only in document mode → Open Google Meet → Connect call audio instruction → separate microphone status → Open floating card. Anyone may sign up; users without invited live-call access see a clear testing-access message rather than a working Start control.

Main action progresses: **“Open Google Meet”** → meeting tab; **“Connect call audio”** → Chrome picker; **“Open floating card”** → Document Picture-in-Picture after user click. Tell the rep to select the Meet tab and enable tab audio. A link alone never marks the audio connected.

Empty: “Add your Google Meet link.” · Loading: “Connecting call audio…” · Error: “No meeting audio connected. Select your Meet tab and enable tab audio.” · Done: “Call audio connected.”

### Floating card: for quiet assistance during a live call

Top to bottom: small blob and truthful Listening/Paused/Disconnected status → recognised customer question → conversational bullet-point answer, at most 40 words → document section/page then source name last, or the visible label “Not from your document” in generic mode → Pause, Stop, Hide answers and source inspection controls.

Main action: **“Start listening”** when ready; **“Pause”** while active. Stop releases audio capture. Hide answers clears the answer content; it does not pretend listening has stopped. Keep the app tab open. Closing the floating window returns the panel to the app and leaves an explicit active-listening indicator until stopped.

Empty: “Listening for customer questions.” · Loading: “Finding the answer…” · Error: “Listening unavailable. Reconnect call audio.” · Done: show the selected-mode answer. In document mode, absent evidence says “I couldn’t find this in your source.” Never silently fall back to generic knowledge. Every generic result, including follow-ups, displays “Not from your document”.

Show a calm warning at 55 minutes: “Cuelo will stop listening in 5 minutes.” At 60 minutes: “Cuelo has stopped listening. Your Meet call can continue.” Clear active listening status and stop capture.

Waiting movement is gentle. While an answer is visible, reduce the blob to a tiny listening indicator. The whole card moves with its handle/blob using browser-supported window movement; the website cannot programmatically place a Document Picture-in-Picture window at arbitrary screen coordinates. Website dragging demonstrates the concept, not an identical positioning implementation.

Fallback: two side-by-side windows when floating mode is unavailable but audio capture works. A layout fallback does not fix unsupported audio capture. Guaranteed screen-share invisibility is outside v1: full-screen sharing can expose the card. Recommend presenting a specific tab and verifying the participant view.

## 5. The first screen's words

Headline: **Your quiet assistant for live calls.**

Under it: **Ask out loud. Get a quick answer in text. Choose general knowledge or add your document for product-specific answers. Built for salespeople who want to stay in the conversation.**

Generic answer label, always visible on the card: **Not from your document**.

The intended feel is an immediate response, with no artificial typing delay. Show honest listening and processing states; do not claim guaranteed instant answers.

Panel welcome: **Ask me anything.**

Instruction: **Tap the mic and speak. I’ll reply in text.**

Button: **Speak to Cuelo** → asks for microphone access, then listens.

Later call invitation: **Experience Cuelo on a call** → practice setup. No words underneath it.

After three questions: **Ready for your next call? Sign up and add Cuelo to a call.**

## 6. Principles

- The user speaks; Cuelo answers only in text. The practice customer avatar is the only speaking character.
- One main action per state; clear labels beat clever labels.
- Keep the opening voice interaction visible without scrolling. The full source-based call demo remains below the opening section, with no top shortcut for now.
- Fixed UI prompts are predefined. Only generated opening answers consume the five-answer allowance; the three-question demo remains available independently.
- Show general-knowledge and source-based modes distinctly. Every generic answer card says “Not from your document” in plain sight. Never invent evidence, silently change modes or imply an uploaded document proves every answer.
- Offer generic/document choice during signup continuation and again in real-call setup. Ask for a source only after the document choice.
- Be friendly without clutter. Use whitespace, readable answers and a small number of controls.
- No artificial delay in answers. Listening animation reflects actual input; processing animation reflects actual work.
- Keep scroll, navigation compression and transitions subtle. Honour reduced-motion preferences; skip typing effects and moving paths for those users while preserving state labels.
- The blob never covers content or controls. Draggability begins after 20 seconds; user positioning takes priority thereafter.
- Do not auto-start the microphone, autoplay the avatar before Start or open a floating window without user action.
- Show failure honestly. Do not fake latency, recognition, source grounding, call connection or invisibility.
- Keep the three-question demo accessible without an account. Ask for signup/login and the Meet link after its first-value experience.
- Do not add database connectors, desktop downloads, browser extensions, pricing, fabricated testimonials or extra screens without asking.
- v1 live calls target desktop Chrome; smaller screens need a usable reading layout, but mobile live-call support is not implied.
- If a design or product choice is not covered here, ask before building it. Unresolved choices include the exact avatar illustration and additional navigation destinations. Authentication, upload limits and retention are specified above.
