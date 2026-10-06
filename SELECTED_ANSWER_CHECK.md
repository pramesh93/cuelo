# Selected-source answer check

Published screen: https://deafening-frog-846.convex.site/?view=answers. Development screen: http://localhost:5173/?view=answers. This is a typed-question check, not microphone input or automatic Google Meet listening. Paid answers remain switched off on the published screen until a production testing allowance is activated.

## Current proof

53 automated tests cover the existing flows and the new answer policy, access checks, cancellation, allowances and model-request settings. Real development Convex and desktop Chrome checks verify source selection, disabled paid admission, deletion invalidation and narrow layout. Answer-card examples were simulated and labelled as simulations. Real GPT-4.1 correctness and elapsed time remain untested; the new paid-testing switch remains off. Existing development usage is 7 of 10 attempts, leaving three. This is an application allowance, not a provider balance.

## Desktop Chrome check after testing is activated

1. Open the development screen. Choose “Answers from my document.” Paste the made-up source below, inspect it and click “Use this source.”
2. Ask “When is single sign-on available?” Expect a short answer preserving the Salesforce condition. Open the supporting passage; its words must match the stored source, with its reference and source name.
3. Ask “Does this product integrate with HubSpot?” Expect “I couldn't find this in your source.” No invented integration or generic fallback.
4. Choose “Generic answers” and ask “What is single sign-on?” Expect a general explanation labelled “Not from your document.” It must not claim verified details about the made-up product.

Made-up source:

> The made-up product supports password sign-in. Single sign-on is available only if a Salesforce account is connected. Password sign-in is available on every plan.

The three checks use at most the three existing development attempts. Do not reset or raise their limit. Editing the question or switching mode cancels an obsolete request; cancellation may still incur provider usage. Delete or replace the selected source and confirm that document asking requires selecting the source again. The UI also allows cancellation while an answer is pending.

## Boundaries and accounting

Each admitted request reserves ₹20 in the shared ledger: up to ₹60 for the three checks. This is a conservative estimate, not the provider's actual charge. GPT-4.1 published prices are $2 per million input tokens and $8 per million output tokens ([official model page](https://developers.openai.com/api/docs/models/gpt-4.1)). The estimate uses ₹100/USD as a planning margin, a 64,000-byte total input ceiling, 500 output tokens and overhead. It is not a live exchange-rate quote. Historical usage reconciliation and provider retention checks remain necessary before live sessions; the disabled ledger is not proof of a complete monthly spending cap.

Questions are limited to 1,000 characters. Related source evidence is limited to 24,000 serialised bytes. Small sources are included completely; larger sources use keyword matches, neighbouring passages and matching references. All matching evidence must fit, or the backend asks for a narrower question. Stored source content is not silently truncated. Semantic retrieval quality and contradiction recall require real testing.

Answers use at most 40 words, excluding citations. Backend validation checks citation identifiers, numbers and explicit conditions; it is not independent semantic proof. Invalid generated output fails without consuming a successful visit answer. Failed/cancelled paid attempts retain their spending reservation and global attempt count. A successful generated answer, including a safe refusal, consumes one of five visit answers. Visit metadata expires after 24 hours; anonymous capabilities are resettable and do not reliably identify a person.

Only ownership, request status, expiry and allowance metadata are stored by this flow. Questions and answers are not saved as history. Fresh agent threads request no message storage and are deleted; provider store is disabled. These settings do not promise deletion of provider-held data. Pending-request metadata has a short expiry and cleanup. No call transcript or prior-call memory is used here.

This check returns a complete text answer rather than streamed text. Streaming, opening voice, the avatar, Google sign-in, secure live transcription, full current-call context and the floating-card Meet flow remain separate unfinished v1 work. The existing public-article answer path is unchanged.

## Approved real check results — 6 October 2026

User approved using the three remaining development attempts, with at most ₹60 reserved. All three were admitted, taking the existing development cap to 10/10. The first sourced-answer request was submitted in actual desktop Chrome, but the verification script incorrectly waited for an HTTP response while the React client used its live connection; its timeout prevented inspection of that answer. The sourced answer is therefore not verified by this run. The checker was corrected before the remaining requests. The unsupported HubSpot question correctly returned the safe source refusal in 1.7 seconds. The generic SSO question returned a general answer with “Not from your document” in 4.3 seconds. These are typed-question-to-card measurements, not spoken-question-to-answer timings or Meet performance. No retries, cap increase or production activation. Paid testing was switched off afterwards; ₹60 is reserved estimates, not confirmed provider billing. Further real sourced-answer verification needs separately approved capacity.

## Completion check — 6 October 2026

User requested completing and publishing the milestone. One additional development attempt was allowed (cap 11, existing count preserved), reserving ₹20. Real desktop Chrome produced “Single sign-on is available only if a Salesforce account is connected.” in 4.5 seconds. Passage 1, the source title and the entire supporting passage matched the stored made-up document exactly. The test source was deleted. Development now has 11/11 attempts used and paid testing was switched off. The four new checks reserve ₹80 total; actual provider charges were not retrieved. All 54 automated tests and the frontend build pass. The answer milestone is functionally verified in development; production deployment includes its interface/backend with paid answer admission disabled. Full Google Meet listening and the remaining v1 experience are still unfinished.
