# Four-round practice: latency diagnosis

Read-only investigation on 6 October 2026. No provider requests, code changes, limit increases or counter resets were made. Production counters are now ten answer attempts used and six transcription attempts used; the answer allowance is exhausted.

## Evidence

The user reported round times of 8, 7, 6 and 4 seconds. They confirmed recall of all four additional details, but said the long wait gave them time to listen; this does not separately prove attention during simultaneous answer reading. Whether the reported clock began at question end or Stop has not been independently confirmed.

Convex completion logs for the last four speech-and-answer pairs were read in memory. Only function identifiers, completion times, durations and failure flags were extracted. No questions, transcripts, answers, provider bodies or credentials were stored in this report.

| Round order | User-reported time | Speech action | Answer action | Sum of action execution times |
| --- | --- | --- | --- | --- |
| 1 | 8s | 2.6233s | 5.8108s | 8.4341s |
| 2 | 7s | 1.0002s | 5.6147s | 6.6149s |
| 3 | 6s | 0.2765s | 2.9590s | 3.2355s |
| 4 | 4s | 0.4679s | 2.7153s | 3.1832s |

The action durations are measured production function execution times, not exact Deepgram or OpenAI provider latency. Speech includes validation, admission and release. Answer includes source fetching/parsing, allowance checks, agent setup, generation, cleanup and evidence checks. Execution times do not include all browser/network delay or time before Stop. Rounded human timings are not precise enough to subtract reliably.

The four pairs finished around 13:05:59, 13:08:17, 13:09:04 and 13:09:31 UTC. They match the sequence of the four recent completed answer actions. Cuelo intentionally does not log their question content, so the association is based on order, not saved transcripts.

## What the code confirms

1. `src/SpeechInput.tsx` waits for `speech.transcribe` to return before it calls `onQuestion`; `src/main.tsx` then calls the existing `evaluation.ask` action. Transcription and answering are sequential.
2. `convex/evaluation.ts` fetches the Slack article on every question before reserving an answer attempt. `convex/evidence.ts` follows validated redirects, downloads and parses the article. The source is not already prepared when the answer action starts.
3. The whole parsed article goes into each model request. There is no selected-passage retrieval yet. The complete generated JSON is awaited before its evidence is checked and the answer returned; no partial answer is displayed.
4. No intentional delay or typing animation exists in this path. Budget and agent database calls add smaller overhead; they are not a seven-second allowance timer.

## What can be inferred, with limits

Using answer completion timestamp minus its execution duration as an estimated start, the interval to the beginning of `evaluationBudget.reserve` is about 2.0s, 3.4s, 0.9s and 0.7s across the four actions. Code places source fetch/parse and prompt preparation in this interval. These are inferred stage intervals, not separately instrumented source-fetch durations; runtime startup may also be included.

The interval after the agent's final logged context read and before cleanup is approximately 2.9s, 1.9s, 1.8s and 1.7s. It includes the model generation wait and SDK work, not a directly measured OpenAI duration. The remaining answer-action overhead is approximately 0.9s, 0.3s, 0.3s and 0.3s.

This supports source preparation and generation as contributors inside the slow answer actions. It does not prove cold starts, provider throttling, question complexity or prompt-cache behavior. No failed execution was flagged in these four action pairs; that alone does not reveal every provider status handled by the application.

Round three's reported 6s is substantially longer than its 3.24s sum of action times. The available records cannot locate the extra interval between browser handling, upload/network travel, the time before Stop or the user's timing method. Do not claim all six seconds were spent at OpenAI.

## Next concrete change to propose

Prepare the validated source while the user is speaking, so source downloading does not sit after transcription on the critical path. Keep the same model, evidence checks, refusal and provenance. Freshness, temporary source expiry, access checks and source ownership must remain enforced on the backend. Then measure individual stages and repeat a bounded human test after approval of any needed paid attempts.

No speed improvement is claimed yet. The user's next approval should be for a concrete implementation plan; the exhausted answer allowance must not be silently increased for retesting.

## Source-preload retest — reported 6 October 2026

User reported three visible answers at 10s, 4s and 6s; the first was a random question safely refused. Timing method is awaiting clarification. Read-only production logs show the latest three answer actions at 6.4630s, 2.7783s and 3.0645s, with preceding transcription actions at 0.6541s, 0.4188s and 0.4480s. Ordered association is inferred, as question content is not logged. Action sums are 7.1171s, 3.1971s and 3.5125s; these exclude browser/network travel and possible source wait after Stop. The source preparations associated with those answers finished before their transcription actions began (2.8300s, 0.5726s and 0.5106s in total, overlapping listening). The prepared-source consume mutation is present in all three answer paths, confirming the deployed preload was used.

The first answer action takes about 2.05s from estimated action start to the source-consume mutation start, and about 3.80s from final agent message lookup completion to cleanup completion. Those are inferred intervals including runtime/network/SDK overhead, not precise provider measurements; no cold-start claim is established. The third reported 6s is longer than the 3.51s action sum, so available logs cannot attribute the complete delay. Source preload does not establish consistent five-second performance.

Production counters: 13 of 14 answer attempts and 10 of 10 speech attempts used. Four new transcriptions led to only three new answer attempts; the reason for the unmatched transcription is not established. No new paid requests, allowance changes, code changes or deployment during diagnosis. Pause spoken tests. Next proposed step is explicit per-stage timing, with no transcripts/audio in logs, before another bounded live retest.
