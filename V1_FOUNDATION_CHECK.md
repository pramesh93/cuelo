# V1 foundation checks

This is a development checkpoint, not a completed v1 release. Production still serves the manual source-evaluation milestone.

## Checks completed

- 24 unit tests pass: source grounding/refusal, existing speech caps, prepared sources, account ownership, invitation checks, Meet destination validation and shared INR reservation rules.
- Frontend build and development Convex push pass.
- Real desktop Chrome against development: signed-out Google screen honestly reports missing configuration and disables sign-in; navigation returns to existing evaluation screen; 390px layout has no horizontal overflow.
- Existing answer display simulation passes. The first synthetic microphone check intermittently ended before enough audio samples were delivered; focused diagnosis showed running audio contexts, and the unchanged product capture flow passed on rerun. The harness now observes actual recorder frames before pressing Stop, instead of treating wall-clock elapsed time as proof of audio delivery. The updated harness passed all microphone regression simulations without provider calls.
- Real internal development spending snapshot is disabled with no new reservations. That snapshot is not provider balance or actual account spending.

## Still required before live release

- Google OAuth client ID/secret in Convex dev and production. Production auth signing secrets and SITE_URL need setup before production deployment.
- Real Google sign-in/sign-out and distinct-account test in desktop Chrome. No scripted Google-login bypass is installed.
- Enforceable continuous-audio route. Deepgram browser-token expiry only gates opening a connection; it does not close an established connection. Do not enable live capture on this basis.
- Per-operation cost calculations including transcription, question detection, GPT-4.1 answers, retries, avatar speech and Convex usage; reconcile existing prototype/provider usage before activating the v1 ledger. Reservations are conservative estimates and must not be displayed as actual invoices or credits.
- Small explicitly approved paid-test allowance and initial tester capacity. No current caps have changed.
- Rest of the approved v1 plan and real Meet/microphone/participant screen-share checks.

## Look at the current development screen in desktop Chrome

1. Keep the development website running with `npm run dev` on `http://127.0.0.1:5173`.
2. Open `http://127.0.0.1:5173/?view=account`.
3. Until Google credentials are configured, expect a disabled Continue with Google button and an honest setup message. No microphone starts.
4. Use Back to Cuelo to return to the current evaluation screen. Do not spend the remaining prototype allowance as a warm-up.
5. After configuration, follow GOOGLE_SIGNIN_SETUP.md for the real sign-in check. Signed-in mode/setup screen has not been verified in a real Google session yet.
