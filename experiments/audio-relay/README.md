# Audio connection feasibility probe

NOT production code. No real Convex admission or Deepgram credentials. No hosting/deployment configuration. This experiment must never be enabled as Cuelo's live relay.

Run `npm ci --prefix experiments/audio-relay`, then `node experiments/audio-relay/check.mjs`.

Runs Cloudflare's workerd locally through Miniflare with a SQLite-backed Durable Object, local fake admission/lease HTTP service and two fake upstream WebSocket connections. Synthetic binary bytes only; no recorded audio, transcripts, personal information or paid requests. Dependencies isolated from the product.

12 checks passed on 7 October 2026: binary forwarding plus Stop, Pause, accelerated deadline despite continued client messages, access revocation, backend failure, client disconnect, upstream disconnect, invalid/replayed ticket, oversized audio, duplicate connection, audio flood and original deadline across reconnect. 24 upstream connections opened and 24 closed. Cutoffs are accelerated; this is not a real one-hour meeting or cloud-hosted reliability test.

Prototype bugs found and fixed: connection-start state persisted into the next call; incoming binary messages arrived as Blob, so reading byteLength without conversion bypassed size/rate validation. Tests now check the shutdown reason and actual bytes reaching upstream.

This feasibility probe intentionally duplicates bytes to two mock sockets to exercise their joint shutdown, not actual customer/microphone separation. Production must add separate authenticated feeds, atomic Convex single-use admission/concurrency, deadlines/leases/budget reservations, secret handling, bounded queues and cancellation-safe upstream establishment. There is no production endpoint, signed-in browser integration or upstream transcription response path in this experiment.

Hosted Cloudflare Free, Koyeb, real Deepgram, real microphone/Meet, 60 minutes of wall-clock connection, platform restarts, free-quota exhaustion and measured real-world delay remain untested. Do not infer those results from local tests.

## Conventional-host / Koyeb candidate

Run `CUELO_PROBE_RUNTIME=node node experiments/audio-relay/check.mjs` for the same 12 rules using a real local Node HTTP/WebSocket server. It passed all 12 with 24 upstream sockets opened/closed. This exercises the program we could run on Koyeb; it does not emulate Koyeb networking or validate hosted hardware, price, uptime or the free plan. Admission/provider remain fake and timers accelerated. No Koyeb service was created.

Run `node experiments/audio-relay/browser-freeze.mjs` from the project root for an actual installed desktop Chrome freeze check (macOS Chrome path currently used). The test page opens two fake upstream connections through the local Node guard, then Chrome is frozen using its testing interface. Independent server cutoff closed both connections 9 ms after the 2.5-second deadline on the observed run. This is not a real microphone, Meet, Deepgram or 60-minute test. No browser animation or UI claims imply those results.
