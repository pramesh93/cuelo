# Configure Google sign-in for Cuelo

Google sign-in is not verified yet. Missing Google client credentials prevent a real round trip. Enter secrets in service settings; do not paste them into chat or files.

1. Open https://console.cloud.google.com/auth/overview and create/select the Google project for Cuelo.
2. Configure the app name and support/contact email. Use an External audience. During Google's testing mode, add the Google accounts that will test sign-in. This Google list is separate from Cuelo's invited-live-call list.
3. Create a **Web application** client under Clients.
4. Add these authorised JavaScript origins:
   - Development: `http://127.0.0.1:5173`
   - Production: `https://deafening-frog-846.convex.site`
5. Add these authorised redirect URLs exactly:
   - Development: `https://calculating-gecko-263.convex.site/api/auth/callback/google`
   - Production: `https://deafening-frog-846.convex.site/api/auth/callback/google`
6. In https://dashboard.convex.dev select **prmsh-biz / build-sprint-app**, then the development deployment **calculating-gecko-263**. Under Settings → Environment variables, enter the client ID as `AUTH_GOOGLE_ID` and the client secret as `AUTH_GOOGLE_SECRET`.
7. Repeat for production **deafening-frog-846**. Secrets and auth signing configuration are separate for each deployment. Production JWT signing keys, public JWKS and SITE_URL were configured on 7 October; no existing development keys were rotated.
8. The app's `SITE_URL` must match the origin being tested. Development currently uses `http://127.0.0.1:5173`; production now uses `https://deafening-frog-846.convex.site`.

## Desktop Chrome check after configuration

Open the development app at `http://127.0.0.1:5173/?view=account`. Click Continue with Google and sign in using an account on Google's test list. It should return to Cuelo signed in. Choose Generic answers or Answers from my document. Sign out and confirm the account screen returns. Repeat with a second allowed account to check accounts are distinct. Signing in alone does not grant invited live-call access.

Do not enable live capture or reset speech/answer limits to perform this sign-in check. It makes no transcription or answer-generation requests.

Official setup reference: https://labs.convex.dev/auth/config/oauth/google

## Current checkpoint — 7 October 2026

Google client ID/secret are absent in development and production. Cuelo signing configuration is present in both environments; production keys were generated in memory and set directly without a secret file or printed values. All 55 tests pass, and real backend checks reject signed-out setup writes in both environments. The next required action is creating/configuring the Google Web application client and entering its two values directly in Convex. Real Google sign-in, sign-out and signed-in source saving are still unverified. No AI/transcription requests or budget changes.

## Production verification — user confirmed

Google client settings are now present in production. Automated installed-Chrome check opened Google sign-in with the exact production callback; user confirmed real sign-in and return, generic-mode Meet setup saving, sign-out/relogin with neither mode preselected and persisted Meet link, and explicit Keep-source persistence after relogin in document mode. Development Google credentials have not been rechecked since production setup. Real second-account isolation remains a release check; automated ownership tests pass. Live listening remains disabled.
