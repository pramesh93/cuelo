# Sidebar checkpoint review — 10 October 2026

Prepared for user approval before commit/push. No commit, push, production deployment, provider request, paid activation, counter reset or budget adjustment performed during this review.

## What this checkpoint saves

- Native development Chrome sidebar: remembered Google sign-in, explicit answer mode, saved-source selection/import and Start.
- Meet-page audio with separate customer/salesperson inputs and bounded trusted relay to the hidden authenticated extension document.
- Backend invited admission, source ownership, spending/allowance checks, short-lived speech credentials, temporary current-call context and ordered independent question answering.
- Retained previous cards, fresh requests for repeats, safe-answer rejection notice, Pause/Resume, Stop, Meet-end cleanup and same-screen four-answer stopping.
- Earlier approved test-only spending reconciliation, guarded against production, plus its audit schema/tests.
- Documentation and existing archived prototypes needed to preserve the build history and prototype-dependent tests. Archived code is not the active extension.
- Supporting website changes already in the workspace, including shared answer generation, extension upload CORS and source-import support. Generated extension bundles match the source.

The working tree also retains the earlier website LiveCall page linked from Account. That page implements the superseded picker/floating-card route; it is not the sidebar controller and is not proof of the approved sidebar experience. Retiring or replacing this public setup route should be reviewed before production publication, rather than changing it during this save/check task.

## Documentation corrected

AGENTS.md, IDEA_SCOPE.md, PRODUCT.md, DESIGN.md and the active extension README now describe native sidebar capture and independent questions. Removed active instructions to keep a Cuelo controller tab open, require a target-tab capture grant, open a floating card or cancel earlier accepted questions. Historical milestone notes remain marked as superseded. Page-controlled stopping limits, screen-share observations, test-limit behavior and parked tests are explicit.

## Unpaid proof

132 automated tests pass. New checks execute the actual backend handlers using in-memory simulated storage and mock model responses; they do not call OpenAI/Deepgram or change cloud records.

- Generic results contain no document evidence, including cached replay. Every generic AnswerCard displays “Not from your document”, including retained/replayed cards and error/refusal states.
- Document cards render the cited source name/reference and exact passage. In real headless Chrome, the passage starts collapsed and opens on click; generic provenance is visible. The answer data is simulated and all browser network requests are blocked.
- Unsupported document questions refuse without a provider request when no passages exist. Missing/deleted/expired source errors remain distinct from simulated provider outages.
- Document admission rejects missing, expired and foreign-owned sources without creating sessions/reservations. Other accounts cannot retrieve call evidence.
- Stop and expiry cleanup delete the target call's temporary text and guest evidence/passages, while preserving other-call text, saved sources and original spending reservations.
- Existing tests cover queue behavior, no salesperson triggers, answer limit, access revocation and safe-answer rejection.

Website build, both extension bundles and TypeScript pass. Existing Vite/auth module-directive warnings are non-fatal. git diff --check passes. Local secret files are ignored; a scan of the changed/untracked inventory found no private-key blocks, long OpenAI keys or JWT tokens. This pattern scan is not a guarantee against every possible secret.

Re-run:
- npm test
- npm run build
- npm run build:extension
- npx tsx --test tests/sidebar-answer-rendering.test.ts
- node tests/check-sidebar-answer-rendering.mjs

## Limits of the proof and deferred work

Existing user-reported real Chrome checks remain as recorded in PROGRESS.md. This review does not claim a fresh real Meet test, measured background continuity, real provider-failure recovery, second-account live-browser isolation or observed cloud deletion. Storage tests verify code behavior using simulated records; they do not erase provider-held data.

Still deferred: salesperson-context usefulness, mixed supported/unsupported multi-part questions, real 55/60-minute checks, Google-window presentation, shorter remembered login, performance and independent provider shutdown. Physical microphone selection and real safe-answer rejection recovery remain unverified.

## Approval requested

Save the reviewed working tree to the established public repository https://github.com/pramesh93/cuelo with a checkpoint commit such as “Save working native Meet sidebar and unpaid checks”, then push. Do not deploy production or change service settings as part of that approval.
