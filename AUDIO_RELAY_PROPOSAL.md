# Continuous-audio relay proposal

Status: user approved preparing this proposal. No Render service, paid test, new credential or production deployment has been created. The full v1 release plan remains active; performance and provider comparisons remain parked.

## Recommendation and cost

Use one Render Starter web service on a Hobby workspace, for the audio relay only. Starter is listed at $7/month; Hobby has no separate workspace subscription fee. Tax and card currency conversion are additional where applicable. Outbound bandwidth above the workspace's shared 5 GB/month costs $0.15/GB. These are published rates, not a guarantee of the final bill; confirm the account's actual price before creating the service.

Website assets and the submission URL stay on Convex static hosting. Accounts, invitation checks, sources, temporary call text, answer generation, cost reservations and session status stay in Convex. No Render database, source storage, auth or frontend hosting is proposed.

Render supports inbound/outbound WebSockets (continuous two-way connections), without a fixed connection-duration timeout. Restarts, deployments and network failures can still interrupt a call; show disconnected rather than pretending to listen. The free service can take about a minute to wake after idle shutdown and is not proposed for the live pilot.

Provider keys remain in Convex. The relay obtains short-lived Deepgram credentials from Convex after backend admission; these credentials stay only in relay memory and never reach the browser. The relay requires a separate backend-authentication secret in both services' environment settings. No secret goes in code, VITE variables, chat, URLs or committed files.

## Proposed flow

1. User signs in, confirms answer mode/source and selects the Meet tab with tab audio, plus their separate microphone. Opening the floating card remains a separate explicit browser action where required.
2. Convex checks invitation, session/concurrency limits, source ownership, exact mode and cost allowance. It reserves expected cost and issues a short-lived, single-use connection ticket bound to the account/session and allowed audio channels.
3. The browser opens one relay connection and presents the ticket in its first message, not a URL. No provider connection opens until the relay atomically claims the ticket through Convex. Browser-selected provider destinations/models/options are rejected.
4. The relay forwards two separately labelled live PCM audio feeds to Deepgram Nova-3 English. It fixes the model, language and retention opt-out on the server. Audio buffers stay bounded in memory; no disk recordings or payload logs.
5. Verified final transcription arrives through the relay and is submitted to Convex. Customer speech may trigger question detection; microphone speech only adds context. Answer generation uses the existing GPT-4.1/evidence protections and selected mode. Listening continues during answers; a newer customer question invalidates obsolete pending output.
6. Keep the full temporary text in Convex for current-call context. Relay restarts do not create past-call memory. Stop clears session text; expiry cleanup handles abandoned calls. Provider-held data is subject to provider settings, not Cuelo deletion promises.

There is no wait to upload a complete recording or fixed multi-second transcription batch. The relay adds a network hop; measured end-to-end speed is still unknown and optimisation remains parked.

## Enforceable controls to implement and test

- One active pilot call globally initially; the backend admits at most one pair of feeds. This is a proposed initial capacity, not an activated setting.
- Atomically consume tickets, restrict reconnects and prevent repeated tickets opening additional billable streams.
- Keep one original backend deadline across pauses/reconnects. Warn at 55 minutes. Relay independently closes upstream sockets at the 60-minute deadline, even if the browser ignores the cutoff.
- Stop immediately releases local capture and closes relay/provider sockets. Backend Stop/revocation also closes the relay using authenticated control, with a bounded lease as fallback. Verify the worst-case revocation delay and reserve its cost; do not claim mathematically instantaneous remote shutdown.
- Pause closes provider streams and suppresses answers; Resume requires fresh admission within the original session deadline. Context remains for the same session until Stop/expiry.
- Fail closed if backend admission/lease renewal fails. Never reconnect blindly with old authorisation. Detect closed tabs, lost permissions, stalled audio, slow outbound connections and provider errors honestly.
- Bound submitted audio bytes against elapsed time, per-channel PCM format, allowed session duration and buffer size. Close upstream connections for slow consumers or a client attempting to send many hours of audio rapidly.
- Store transcript text only in temporary session tables; no routine payload/request-body logging or transcript test fixtures. Use synthetic/public material for simulations.
- Reserve the relay's fixed monthly charge, bandwidth, Deepgram, detection/answers, avatar speech, hosting and retries within the aggregate ₹5,000/month budget. Reconcile existing prototype usage before enabling new paid work. Keep ₹500 headroom and preserve existing prototype counters.

## Bandwidth estimate, not a measured bill

Two mono 16 kHz/16-bit PCM feeds use about 230.4 MB per one-hour call, before protocol overhead and text/control traffic. Ten such calls send roughly 2.3 GB from the relay to Deepgram. Included bandwidth is workspace-wide; other services and overhead also count. Admission must use a conservative reserve and reconcile provider usage rather than assuming the whole 5 GB is available.

## Build and activation order

1. After service/cost approval, implement and test the relay locally with fake upstream transcription and real browser capture. No paid Deepgram/OpenAI calls.
2. Verify single-use tickets, channel separation, duplicate connections, Stop/Pause, permission loss, background switching, restart/reconnect and accelerated cutoff tests. These are simulations, not real Meet proof.
3. Complete Google credentials and real Google sign-in. Prepare the deployment configuration and secrets-entry instructions without putting secrets in the repo.
4. Activate one Starter relay only after approving its cost. Disable automatic deployments from git push; website release remains npm run deploy. Register relay URL explicitly in Convex after deploying; do not invent a live address.
5. Agree a small paid functional-test allowance before enabling transcription/answers. Test real desktop Chrome Meet, physical microphone/tab audio, floating card and participant screen-share view. Keep performance experiments parked and report actual observed delays.
6. Continue the approved v1 source/UI/onboarding stages, then ship only after the relevant real flows are verified and the user confirms the release.

## Official sources checked 6 October 2026

- Starter compute rate: https://render.com/articles/render-vs-railway
- Workspace/compute cost model: https://render.com/articles/how-much-does-cloud-application-hosting-cost-for-small-businesses
- Workspace plan fee: https://render.com/docs/platform-features-by-plan
- Continuous connection support and interruptions: https://render.com/docs/websocket
- Included bandwidth and additional charges: https://render.com/docs/outbound-bandwidth
- Free-service limitations: https://render.com/docs/free
- Why browser-token expiry is insufficient: https://developers.deepgram.com/guides/fundamentals/token-based-authentication
