# Cuelo checkpoint — 16 October 2026

This is the current approved implementation and verification record. It supersedes conflicting older implementation notes in the other project documents; unchanged product constraints and user approval rules still apply. Saving this checkpoint to GitHub does not authorize production deployment, a Store update, paid activation or additional testing allowances.

## Website and account flow

The website and matching extension share Google sign-in/sign-out. Signed-in users have a lavender glass workspace with Home, Content and Profile. Activity, Insights, Integrations and future account actions remain disabled. One-time role/company details are stored for future personalization, not inserted into answer prompts.

Before the first completed call, Home guides installation, choosing knowledge and starting Meet. An installed extension skips installation. Each new Home visit starts at knowledge until a completed call is recorded. Content can be added inline during onboarding. Completed-call accounts see analytics; a missing extension shows a reinstall reminder without hiding analytics. Account sources remain saved until edited/deleted. Call analytics keep dates, listening duration and answer counts, not conversations or answer history.

The published Chrome listing is https://chromewebstore.google.com/detail/cuelo/hoafcdkncbacbngcdnamefjhelijkpbm. Windows and Mac downloads remain disabled. The public website demo retains its three submitted questions per India calendar day and existing backend spending controls.

## Extension and audio

Current development code is extension/meet, Cuelo — development. Participant sound is captured directly from the bound Meet tab using Chrome tabCapture in the trusted offscreen call page. It does not search Meet audio/video elements or generate substitute silent customer audio. Computer speaker mute does not prevent capture; playback is restored to the OS output. The salesperson microphone remains separate, obtained on Meet and gated by Meet's visible mute state; an unknown state means off.

Chrome tabCapture/activeTab permissions are required. Chrome may require clicking Cuelo's extension icon on the Meet tab before Start/Resume. A tab-sharing picker and floating window are not used. Capture/processing checks precede paid admission. Pause, Stop, meeting end and failures release audio. Temporary call text/source-selection links are deleted on Stop/end/expiry. No audio recording or past-call transcript/answer history is added.

The compact sidebar uses the website's Nunito Sans, purple accents and lavender glass. Setup controls and Start fit the checked 320×540, 400×600 and 400×900 viewports. Long answers/evidence and expandable history scroll within their areas while typing and call controls remain visible.

Explicitly choose generic knowledge or up to 20 owned saved sources, with a combined 1,000,000-character source bound. Manage content opens the website; it is not an embedded editor. All selected sources, including secondary ones, are ownership-checked and protected against editing/deletion during active or paused calls.

Typed questions go through Convex to GPT-4.1 answer generation, not Deepgram transcription or paid question classification. Deepgram continues handling call audio while listening is on. Typed submission shows “Finding your answer…” through acceptance/queued work until completion or failure. Independent questions are retained; later speech never cancels an accepted question. Salesperson speech adds temporary context, never triggers answers.

Document answers link the actual supporting source names to a read-only, account-protected source page on the matching website. PDFs, Word documents, webpages and pasted-text citation groups with any passage over 600 characters show source links only, without extracted headings or paragraph/pricing fragments. Short pasted-text evidence may expand inline. Multi-source bullets link their supporting documents directly. Website evidence cards outside this sidebar context retain their existing behavior. Generic call answers visibly say “Not from your document”.

## Limits and current testing state

Production customer trial remains three successfully connected calls or 90 active listening minutes, whichever ends first; each call also has its 60-minute maximum. Pause excludes listening time. No production four-answer limit applies.

Development retains the four-answer, two-connection and 20-detection test limits. All 16 approved global development sessions are now used. The reviewed development account used its three regular calls plus one explicitly approved development-only retest (four calls total, about 12 minutes); historical counts/time were not reset. That extra allowance is exhausted. Live listening is off in development and production. Further paid testing requires a fresh explicit allowance; do not silently change counters, trial grants or budgets.

Monthly budget remains ₹5,000: development reservation cap ₹1,500; production ₹2,000; ₹1,000 hosting/other services allowance; ₹500 buffer. Last verified holds: development ₹1,500, production ₹500. Production's remaining three planned test calls are not enabled. Reservations are conservative holds, not provider invoices or a guarantee of external billing. Development live admission now checks the allocation directly; this fix must be included in the separately approved production release before listening is enabled.

## Verification and release boundary

215 automated unpaid tests pass. Website and all four extension builds pass. Chrome UI checks use fictional accounts, answers and browser/provider services. They cover compact layouts, typed processing/completion/failure, evidence/source links, read-only source viewing, content management, navigation, branding and call controls. They do not prove real Google or provider behavior.

The user confirmed real development participant answers with computer speakers muted, a mixed question supported by both selected sources with correct evidence, Pause/no answer, Resume/answer and automatic stopping at Meet end. Backend checks confirmed ended-call cleanup. The last approved retest recorded one answer, but correctness of the final typed-status and source-link-only changes has not been confirmed live. Do not claim it has. Latest UI changes have simulated Chrome verification only.

Production currently has the earlier website/Store extension and a separately approved budget-only backend update. The new workspace, sidebar, tab capture and final source-link UI are not released there. Pushing this GitHub checkpoint does not deploy them.

Before a production release: update the Store package's version (currently still 0.1.1) and missing tabCapture/activeTab permissions, review privacy/data/permission disclosures including scripting, audit the exact package/environment, and coordinate compatible website/backend/Store publication. Verify shared sign-in, owned sources, real capture, Pause/Resume/end, trials and the budget guard against that exact release. Keep production listening off until separately approved. Duration, conversation-context usefulness, speed and the previously parked real saved-source deletion check remain deferred and must not be reported as passed.
