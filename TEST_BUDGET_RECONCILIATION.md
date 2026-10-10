# Development-only budget reservation review

Prepared at the user's request on 10 October 2026. No reconciliation has been
applied. OpenAI usage reported by the user: $0.11; Deepgram usage: $0.14832.
These are user-reported consumption totals, not independently retrieved invoices.
Convex costs and usage outside those reports remain separate.

The tool preserves original spendingReservations and their amounts. An adjustment
has its own spendingReconciliations record containing the original ledger amount,
released amount, retained amount, provider reports and affected reservation IDs.
Only closed live calls with recognisable references created by the report cutoff
are eligible. Existing call rows (including paused/expired), unknown references,
later reservations and non-live reservations retain their full hold. The ₹5,000
budget, ₹500 safety headroom, call/answer counts and per-new-call ₹500 reservation
are unchanged. No transcripts, audio or account identities enter the audit.

This is a narrow, manual, development-only review, not automatic provider billing
integration. At least ₹100 must remain held for the reported sub-dollar usage;
₹100 is a provisional accounting cushion, NOT a measured rupee invoice or an
exchange-rate claim. One reviewed adjustment per month; identical retries are
idempotent and changed/stale approvals are rejected. Further adjustments require
another review. Do not apply without reviewing the live preview with the user.

## Publish code to the approved test backend

From the project folder:

```sh
CONVEX_DEPLOYMENT=dev:calculating-gecko-263 npx convex dev --once
```

## Read-only preview

First confirm all test-call capture has stopped. The cutoff below is 10 October
00:00 UTC; later reservations are deliberately excluded. The reported October
1–10 usage is conservatively retained against this earlier subset of calls.

```sh
npx convex run --deployment calculating-gecko-263 spending:previewTestReconciliation '{"month":"2026-10","confirmedThrough":1791590400000,"retainedPaise":10000,"openAiUsdMicros":110000,"deepgramUsdMicros":148320,"callsStoppedConfirmed":true}'
```

Share beforePaise, closedCalls, closedHeldPaise, releasePaise and afterPaise for
review. All amounts ending in Paise are integer hundredths of a rupee. This query
does not change data. No exact release amount is known until this query succeeds.
The internal applyTestReconciliation mutation also requires the exact reviewed
before/release amounts, rechecks eligibility atomically, and refuses production.
