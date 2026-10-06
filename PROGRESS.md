# Cuelo progress

The user authorised shipping milestone 1 on 6 October 2026. PLAN.md and this file were missing when milestone 1 started. The agreed source and acceptance questions are recorded in PLAN.md.
6 Oct: Milestone 1 done. SSO-on-Pro answered with the Salesforce condition and the exact excerpt (2.5s). Custom-integration promise refused as "Not verified" (2.8s). Still broken: nothing known.

6 Oct: Published public repository pramesh93/cuelo and deployed with npm run deploy to https://deafening-frog-846.convex.site; live Chrome checks passed for conditional Pro SSO (2.6s), unsupported integration refusal, and narrow layout; all 11 automated tests and frontend/backend type checks passed. Voice, login and live calls remain unbuilt.

6 Oct: Implemented spoken source evaluation with Deepgram Nova-3 through Convex, bounded audio and spending checks, and the existing answer action unchanged. Real microphone verification and user confirmation are pending; production still serves the previous typed milestone. Setup and Chrome steps are in MICROPHONE_CHECK.md.

6 Oct: All 15 automated tests, frontend build, backend types and development push passed. Chrome simulations passed supported/refusal answers, Stop/Cancel cleanup, empty transcript, stale results, device loss, permission refusal, hidden tab, late permission, 20-second cutoff and narrow layout. The real development backend also showed the missing-key message before capture. Deepgram key and live speech verification remain pending; no speech provider requests were made.
