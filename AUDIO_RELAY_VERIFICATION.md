# Cheapest audio-route verification — 7 October 2026

Status: local feasibility proof only; no provider selected or activated. User requested verification/testing before choosing. Live Cuelo unchanged, no new paid service, no Deepgram/OpenAI calls or allowance changes.

## Evidence

Cloudflare's local workerd runtime passed 12 guarded-connection checks with synthetic bytes and fake admission/provider sockets. All 24 opened upstream connections closed. Exact test scope, limitations and rerun directions are in experiments/audio-relay/README.md. The deadline was accelerated, not a full 60-minute run. A local emulator does not prove hosted reliability.

Cloudflare Free is a candidate, not yet a validated recommendation. It supports SQLite-backed Durable Objects and outbound WebSockets. 13,000 GB-seconds/day at 128 MB corresponds to roughly 28.9 aggregate active object-hours/day, before other work. 100,000 metered requests/day also limits capacity; frequent audio frames and lease/alarm/storage operations must be counted conservatively. Exceeding limits causes operations to fail. Existing account usage must be checked and new session admission kept below quota; cannot claim free quotas automatically provide safe shutdown.

Koyeb is the low-cost conventional-host fallback: published eco-nano compute $1.61/month, standard nano $2.68/month, excluding taxes/other resource charges. WebSocket duration up to 12 hours with keep-alives supports the one-hour requirement on paper. Capacity, billing and real hosted connection are unverified. No Koyeb account/service created.

## Required before selecting/enabling

1. Access to a Cloudflare Free account; deploy an isolated probe only, no Cuelo hosting/account/data migration. No paid plan activation.
2. Run a real hosted 60-minute two-feed synthetic connection, measure forwarding/drop counts and server cutoff, manual stop, revocation, backend failure, duplicates and reconnect deadlines. Verify idle/stall and restart behaviour and quota accounting; repeat on fallback only if needed.
3. Secure production Convex ticket/lease/budget integration and upstream credential controls; current prototype is deliberately not production-ready.
4. Real Deepgram/Meet test needs explicit bounded paid test allowance and provider retention checks. Existing prototype limits remain unchanged. No claim of real recognition, speaker handling or useful answer latency until measured.

## Official documentation checked

- https://developers.cloudflare.com/durable-objects/platform/pricing/
- https://developers.cloudflare.com/durable-objects/best-practices/websockets/
- https://developers.cloudflare.com/durable-objects/api/alarms/
- https://developers.cloudflare.com/durable-objects/concepts/durable-object-lifecycle/
- https://www.koyeb.com/docs/reference/instances
- https://www.koyeb.com/docs/reference/edge-network
- https://www.koyeb.com/docs/faqs/pricing

## Koyeb candidate — local tests requested by user

7 October: user explicitly requested testing the other option. Implemented an isolated conventional Node host probe, reusing the 12 connection checks. All passed: actual synthetic bytes forwarded, 24 provider sockets opened/closed, correct shutdown reasons, bounded audio/rate, duplicate rejection, pause/reconnect preserving original deadline. Actual desktop Chrome page freeze test independently closed two fake upstream sockets 9 ms after a 2.5-second server deadline. These prove local Node behaviour only. Koyeb account access requested; hosted 60-minute, free-plan restart/capacity, real provider and billing tests remain outstanding. No service selected/created, no paid calls or product changes.

## Parked by user

7 October: user explicitly deferred this evaluation, independent stopping and hosted one-hour tests together with performance tests. Preserve local experiments for later. Page-controlled manual/automatic Stop is the requested v1 path, accepting its independent-enforcement limitation. No provider selected or external service activated.
