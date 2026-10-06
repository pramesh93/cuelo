# Check spoken source evaluation in desktop Chrome

This milestone adds one spoken question to the existing Slack SAML evaluation. It is not Meet listening, speaker separation or the opening generic demo. Answers still use the original evaluation.ask action, unchanged.

## Enable development testing

1. In the [Deepgram Console](https://console.deepgram.com/), create a speech-to-text API key and check available credits. Keep the key out of chat and source files.
2. In [Convex development settings](https://dashboard.convex.dev/t/prmsh-biz/build-sprint-app/calculating-gecko-263), open Settings → Environment Variables and enter `DEEPGRAM_API_KEY` directly.
3. Set `SPEECH_TESTING_ENABLED` to `true` only when ready for paid testing. The existing `OPENAI_API_KEY` and `EVALUATION_TESTING_ENABLED=true` are also needed. Set the speech flag back to `false` to stop new transcription requests.
4. Production has separate environment variables. The user confirmed the microphone flow in Chrome on 6 October 2026, authorising release with the existing tested provider settings.

The backend admits at most ten transcription attempts per deployment, reserving an estimated $0.01 each before the provider request. Failed requests count; no automatic retry. Only one transcription can be in progress; abandoned reservations expire after one minute. The existing ten-attempt answer allowance is unchanged. If it is exhausted, the microphone flow refuses admission before transcription. These small development pools are not the complete monthly public-launch budget.

## Walk the real microphone flow

From the project folder, run `npm run dev`. Open http://127.0.0.1:5173/ in desktop Chrome. Chrome permits microphones on localhost; the hosted site requires HTTPS.

1. Click **Speak a question**, allow microphone access, and wait for **Listening**.
2. Say **“Do you support SSO on the Pro plan?”**, then click **Stop & answer**. The microphone should switch off immediately, before transcription and answering.
3. Check that the recognised question appears in the text field. The answer must preserve the condition that a Salesforce org is connected to Slack, with its exact supporting excerpt and **Who can use this feature?** citation. Open the source link to compare it.
4. Repeat with **“Can you guarantee a custom integration by Friday?”**. Expect **Not verified in this source**, with no supporting excerpt or invented promise.
5. Note the displayed **Stop to answer** time. This includes transcription and the answer round trip, beginning when Stop is clicked. The existing **Measured response** is backend answer time only; neither measures the actual acoustic end of speech.
6. Start again, then press **Cancel**. Check that Chrome no longer shows active microphone capture and that no answer appears. Cancel after upload hides late results but cannot recall a request already sent to a provider.
7. Deny microphone access in Chrome’s site settings, reload and try again. Expect a permission message and a usable typed question field.
8. Try silence, disconnecting the microphone, switching tabs while listening, and speaking past 20 seconds. A microphone problem or time limit must stop capture and show a useful message. The 20-second limit discards the question instead of silently truncating it.

If Chrome cannot capture audio, check both Chrome’s site microphone permission and macOS System Settings → Privacy & Security → Microphone for Google Chrome. A browser simulation cannot verify those hardware permissions.

## Audio and data boundaries

Audio is held in browser memory only while capturing. After Stop, the browser sends a canonical mono 16 kHz, 16-bit PCM WAV to a Convex action. The backend checks its format and actual byte count before calling Deepgram; maximum 20 seconds / 640,044 bytes, minimum 0.1 seconds. Recognised text must fit the existing 1,000-character question limit; oversized audio or text is rejected, never truncated.

Deepgram Nova-3 English is called with `mip_opt_out=true` on every request. [Deepgram documents](https://developers.deepgram.com/trust-security/your-data) that opted-out audio and transcripts are retained only while processing; request metadata and usage logs remain separate. Confirm the opt-out under Deepgram Console → Usage → Logs during the first real check. No account-specific provider settings have been inspected by this implementation.

Cuelo writes no audio or transcript to its database, file storage, analytics or application logs. The recognised text stays in the current page until changed or closed. The existing answer path sends the question to OpenAI with its existing provider-retention behavior; Cuelo cannot erase provider-held data.

## Automated checks

- `npm test`: evidence, spending admission, audio validation and provider failure tests.
- `npm run build` and `npx tsc --noEmit -p convex/tsconfig.json`: frontend and backend compilation.
- `node tests/check-browser.mjs`: **simulated** typed-answer rendering regression.
- `node tests/check-microphone.mjs`: **simulated** generated audio in Chrome with mocked transcription/answer responses. It verifies actual audio capture code, controls and cleanup, but does not prove human speech recognition or real microphone hardware.

The user confirmed that the microphone flow works in Chrome on 6 October 2026. Detailed hardware failure-check results and user-measured latency were not reported. Automated generated-audio checks remain simulations.

## Source preload retest

The approved speed change loads the public Slack article while the microphone is listening. Stop still turns the microphone off immediately. If the article is still loading, the page says “Microphone off. Preparing the article…”. The prepared article is used for one question and deleted after use or cancellation; abandoned preparations expire after two minutes. No audio or transcript is saved. The model, evidence checks, refusal and spending limits are unchanged.

The user authorised the four-question production retest after checking provider limits. The production answer cap is 14 lifetime attempts (10 already used); the speech cap remains 10 (6 already used). Counters are not reset. In desktop Chrome, open https://deafening-frog-846.convex.site and reload. Use the four questions in PRACTICE_CUSTOMER.md with no warm-ups or retries. Speak each question, press Stop & answer, and record the displayed Stop-to-answer time. Check the exact excerpt and Salesforce condition for Pro SSO. Also cancel once while listening and confirm Chrome’s microphone indicator turns off. Only the physical-microphone retest establishes production speed; automated audio/provider simulations do not.

## Background listening fix (local development)

The local prototype no longer cancels solely because document.hidden becomes true. Its existing 20-second capture limit still applies. Cancel, lost microphone and page-leave cleanup remain active. The automated hidden-page test uses synthetic audio and mocked providers; it proves the application rule, not a real Meet call. The separate automated second-window check kept capture active but did not produce document.hidden=true. Real Chrome window switching with physical audio remains required after the Meet flow is available. Production has not received this fix yet.
