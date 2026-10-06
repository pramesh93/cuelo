# Check milestone 1

## Current state

Typed evaluation screen and Convex answer action are deployed. The user authorised shipping on 6 October 2026; real production checks are recorded in PROGRESS.md. Only the named Slack SAML article is accepted; this is not the voice onboarding, an upload flow or a live call.

## Start locally

From `/Users/avantikamishra/build-sprint-app`, run `npm run dev`, then open http://127.0.0.1:5173 in desktop Chrome. The development backend is calculating-gecko-263. `npm run check:backend` updates that development backend; it does not publish the website.

## Enable real answers

Paid testing first needs the user's explicit approval under AGENTS.md. After approval, enter `OPENAI_API_KEY` directly in **Settings → Environment Variables** for the development deployment at https://dashboard.convex.dev/t/prmsh-biz/build-sprint-app/calculating-gecko-263 . Never paste it in chat or a source file. The OpenAI project needs available API credits and GPT-4.1 access.

Set `EVALUATION_TESTING_ENABLED` to `true` in the same deployment only after approval. Set it back to `false` to stop further paid requests.

This evaluation admits at most 10 paid attempts in total, shared across users, reserving $0.10 per attempt before generation. Failures consume a reservation; there are no automatic retries. This is a small development guard, not v1's full cross-provider monthly budget or per-visit allowance. Do not reset the count without reviewing spending. Only counts and conservative estimated cost are saved, not questions or answers. Source text lives within a single action. No agent thread/history is saved.

Model: GPT-4.1 Chat Completions, `store: false`, at most 500 output tokens. Normal answer: at most 40 words. Provider retention is separate from Cuelo storage: OpenAI's default abuse-monitoring logs may retain content for up to 30 days. Account-specific retention controls have not been inspected. Reference: https://developers.openai.com/api/docs/guides/your-data . Use only this public source and non-sensitive evaluation questions.

Input limits are explicit: question 1–1,000 characters; readable source 24,000 characters; total serialized model input 32,000 characters; fetched HTML 2 MB. Oversized inputs are rejected, not truncated. Excerpts keep source words and punctuation; HTML whitespace is normalised for reading.

## Acceptance checks

1. Click the example **Do you support SSO on the Pro plan?**, then **Check the source**. Require a short answer that explicitly makes SSO conditional on connecting a Salesforce org to Slack. Require the complete supporting availability passage under **Who can use this feature?**, with the source link.
2. Click **Can you guarantee a custom integration by Friday?**, then **Check the source**. Require exactly **Not verified in this source**, with no invented excerpt or delivery promise.
3. Open the source link and compare the displayed excerpt to the article. Measure the displayed response time; it is measured from backend request start through source fetch and model response, not from spoken question end.

Run `npm test` for evidence checks and `npm run build` for frontend compilation. `npx tsc --noEmit -p convex/tsconfig.json` checks the backend types.

`node tests/check-browser.mjs` checks rendering with **simulated** answers; it does not test AI correctness or speed. After paid testing approval and key setup, `node tests/check-browser.mjs --live` makes two real model requests and checks the two acceptance outcomes in Chrome. Six evidence tests, the build, backend type checks, live article extraction and simulated desktop/narrow browser checks passed during implementation. An initial simulated-browser run timed out because it intercepted the wrong connection type; the connection path was corrected and the rerun passed. The real backend's disabled-testing message was also checked in Chrome.

## Assumptions and remaining gate

The user's latest Slack SAML article and two questions replace the earlier notifications article as this milestone's acceptance set. The refusal text is the user's exact wording. No login is needed for this local evaluation. Development setup is authorised; production shipping was authorised by the user. Repository: https://github.com/pramesh93/cuelo (public). Website: https://deafening-frog-846.convex.site.

PLAN.md and PROGRESS.md were missing and were reconstructed from agreed decisions. The existing Idea_Scope.md was read under its actual filename. The two acceptance questions were checked live; this does not validate voice or live calls.

## Production shipping

Run `npm run deploy` to build against the production backend, deploy backend functions and upload website assets with @convex-dev/static-hosting. Production provider settings are in Convex, separate from development; local secret files are ignored by Git. The small 10-attempt evaluation cap applies separately to each deployment and is not a public-launch spending system.

Run `CUELO_TEST_URL=https://deafening-frog-846.convex.site node tests/check-browser.mjs --live` for two paid production checks; omit `--live` for simulated display checks.
