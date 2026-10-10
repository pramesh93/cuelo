# Page-controlled live calls — development review

Implemented after the user's approval to defer the independent audio service. Production is unchanged. This is not yet verified with real Google Meet or Deepgram.

## Checked

- 65 automated tests pass, including source grounding, generic provenance, customer-only detection admission, current-call context, account/invitation checks, allowance reservation, cancellation and original pause/resume deadline.
- Frontend build passes.
- Actual installed desktop Chrome processes two generated audio feeds through the production AudioWorklet. Speech sockets and recognition messages are simulated; no paid provider calls occur.
- Chrome simulation checks separate customer/microphone handling, continued processing after a visibility event, both socket/track closures on Stop and connection loss, and an accelerated deadline.
- The audio check originally used a fixed 220 ms startup wait and failed intermittently. It now waits for both feeds to produce real PCM blocks, with a bounded three-second timeout; repeat runs pass.
- Signed-out live setup and narrow layout are checked. These checks do not prove real window switching, Meet capture, actual transcription, signed-in floating-card behaviour or participant screen-share visibility.

## Desktop Chrome real check, after test admission is enabled

1. Sign in, open `?view=live`, explicitly select document mode and confirm the test source (or generic mode for a separate check).
2. Prepare call, then Connect call audio. Select the Google Meet browser tab and enable tab audio; allow the separate microphone. Use headphones to avoid customer audio feeding the microphone.
3. Open floating card. Another participant asks four questions, including one unsupported by the selected source. Inspect references and the safe refusal. Speak from the salesperson's microphone and confirm it adds context without triggering answers.
4. Have the customer ask a new question while an answer is processing; only the newest answer should remain. Switch between Chrome windows and confirm the next customer question still works.
5. Pause: audio/transcription should stop. Resume requires a new capture choice and consumes another connection grant if that is enabled. The original 60-minute deadline remains.
6. Stop: both microphone and tab capture indicators should turn off, and later speech should produce no answer. Verify with the provider dashboard that usage has ended; browser simulations cannot prove provider billing.
7. Check microphone refusal, missing tab audio, disconnected audio, source deletion and temporary network loss. Check the actual 55/60-minute controls separately; accelerated timers are only simulation evidence.
8. From the other participant's screen, check tab/window/whole-screen sharing. The floating card may be visible during whole-screen sharing.

Before this test: verify provider retention settings, grant the intended account tester access, and explicitly configure a bounded test session/connection/detection/answer allowance and spending reservation. Existing exhausted prototype limits are not reset automatically. Paid admission remains off until this is agreed.

## Accepted v1 limits

Stop and normal automatic controls act from the open Cuelo page. Leaving Meet while its tab stays open may require manual Stop. A frozen or modified page may leave an established speech connection open; temporary token expiry does not terminate it. Independent stopping and performance/provider comparisons remain parked.

Backend temporary context: maximum 500,000 characters, 7,000 completed turns, 2,000 characters per turn. Oversize text stops processing with a message; it is not silently truncated. Full current-call text is retained temporarily and removed on Stop or expiry; saved sources remain. No audio recording or answer history is stored by Cuelo. Provider-held data requires separate retention controls.
