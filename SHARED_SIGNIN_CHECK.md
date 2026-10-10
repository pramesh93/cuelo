# Shared website/sidebar sign-in — unpaid development check

Implementation approved 10 October 2026. User confirmed real Google sign-in and sign-out in both directions between website and installed sidebar, plus remembered login after restarting Chrome. This check does not click Start, issue speech credentials or spend an answer/call allowance. Production is unchanged.

## Prepare

- Stop any active Cuelo call. Reload **Cuelo — development** from extension/meet at chrome://extensions.
- Open or refresh http://127.0.0.1:5173/?view=account in the SAME Chrome profile. The local website must be running (npm run dev) against calculating-gecko-263. Do not use the production website with the test extension; sessions and sources intentionally remain separate.
- Refresh other Cuelo website pages opened before this update. No extra permanent controller tab is required once sign-in completes.
- Existing same-account logins should migrate automatically. If website/sidebar previously used different accounts, the website asks whether to use the sidebar account or sign out of both. A failed/expired legacy login offers sign-out and retry rather than silently replacing the account.

## Check in order — do not start listening

1. Sign out, then sign in with Google on the local website. Open Cuelo beside a joined Meet. Confirm it is already signed in with the same saved source/access; no second Google sign-in.
2. Sign out from the website. Confirm the sidebar returns to sign-in.
3. Sign in with Google from the sidebar. Open/refresh the local website account page. Confirm it already says signed in; no second Google sign-in.
4. Sign out from the sidebar. Confirm the open website returns to sign-in.
5. Sign in again, close/reopen the sidebar, then restart Chrome and reopen both. Confirm remembered identity matches. Browser profile/extension removal or expired credentials can require a fresh sign-in.
6. On the website, continue with generic mode or confirm a source. Confirm it shows sidebar instructions, without a Meet-link form, sharing picker or floating-card button. Direct /?view=live must show the same guidance and “Audio is off.”

User confirmed website sign-out during active listening stops Cuelo while Meet continues, after the hidden-page login fix. Active-call account switching remains unverified.

## Unpaid automated proof

- npm test — 143 tests pass, including shared sessions, logout, central refresh, migration, expired/cancelled callbacks and sender/environment isolation.
- npm run build and npm run build:extension pass (sidebar, offscreen owner, shared auth worker, website bridge).
- npx tsx tests/check-shared-signin-browser.mts — actual Chrome website guidance and DOM message bridge; extension APIs and session data simulated, remote browser requests blocked. It does NOT prove Google sign-in or installation.
- Original auth provider, Google-only signup, session duration, invitation rules, source ownership, model providers and paid limits unchanged.

The implementation uses the installed Convex Auth/Convex clients and Chrome's documented isolated content-script messages. Refresh credentials stay in trusted extension storage; only short-lived access state and one-use OAuth verifier data return to the configured website. Unknown origins, other environments, iframes and arbitrary extension pages are rejected. Chrome docs: https://developer.chrome.com/docs/extensions/develop/concepts/messaging and https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts.

## User-confirmed checks — 10 October 2026

- Website sign-in signs the sidebar in; website sign-out signs the sidebar out.
- Sidebar sign-in signs the website in; sidebar sign-out signs the website out.
- Website and sidebar remember sign-in after restarting Chrome.
- User confirmed Continue with Google appears after signing out with no Meet call open.
- Google sign-in continues using its temporary popup window, as requested.
- User confirmed Start works and website sign-out during listening stops Cuelo while Meet continues. Active-call account switching and the remaining parked call tests are unverified.
