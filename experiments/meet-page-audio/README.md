# Cuelo Meet-page audio check — unpaid prototype

Approved 9 October 2026. Separate temporary extension, not the production Cuelo call system. Reads candidate audio tracks exposed by playing, unmuted Meet audio/video elements. It never changes/stops Meet's original tracks; only its own clones. Separate microphone uses already-granted Meet permission. Meters stay local: no recordings, transcripts, answers, provider calls, backend access, login, account/spending changes, sharing picker, or new tab/window. The source dropdown is explicitly an audio-check sample; no document is imported or read.

This is a feasibility check, not evidence of reliable customer/salesperson separation. Muted local preview is excluded heuristically. Actual Meet may expose no usable tracks, use other playback methods, or change its page. A meeting meter that reacts to your speech fails the separation requirement. Headphones are needed to check microphone isolation without loudspeaker echo. Mic capture uses the browser's selected/default device, which may differ from Meet's chosen device; verify device changes. English controls determine joining/mute; unknown mute state gates Cuelo's microphone off.

## Desktop Chrome check

1. In chrome://extensions temporarily switch off Cuelo — development so you do not open the wrong sidebar or start a paid session. Enable Developer mode, click Load unpacked, and choose `/Users/avantikamishra/build-sprint-app/experiments/meet-page-audio`.
2. Open this new extension on an ordinary tab. Leave the sidebar open. Create a NEW Meet tab in the SAME Chrome window and join a meeting. Meet's microphone permission must already be allowed. Do not click the extension toolbar again after joining.
3. The test-source dropdown should appear automatically. Choose **Audio check sample — no document or AI connected** and click **Start**. No sharing picker, extra permission window or Cuelo website should open.
4. Use headphones and a participant joining from another computer. Have that participant speak while you stay quiet, then have them stay quiet while you speak. With cameras OFF, the Meeting audio candidate meter should react only to their speech; Your microphone should react only to yours. Send whether the meeting meter moves and how many tracks are shown. If no tracks appear after another participant speaks, the candidate route failed; do not call it listening successfully.
5. Mute yourself in Meet. Your microphone meter must stay off while the participant meter continues. Unmute. Test participants joining/leaving and microphone/headphone changes, then switching to another tab AND another Chrome window. Use another participant to confirm Stop has not disrupted normal Meet sound or your own speech.
6. Pause must zero both meters; Resume must restore them with the original cutoff. Stop must zero both and allow another Start. Leave Meet while staying on its tab; state must read **Meeting ended; audio is off**. Repeat Meet-first → extension to cover the other order. Closing the sidebar intentionally leaves the check running; reopen to Stop. Closing/refreshing the Meet page stops its resources.
7. After checking, Stop, disable/remove this temporary check extension and re-enable Cuelo — development. The real extension's microphone route remains unchanged until the prototype proves the required behavior and integration is approved.

Calls cap at 60 minutes, warn at 55, and Pause retains the original deadline. The prototype exposes no historical call data. A suspended/frozen whole browser cannot execute immediate cleanup; independent freeze enforcement remains parked. Background meter sampling under real Chrome must be tested, not inferred from timer simulations.

## Verification so far

Eight new simulated track/Chrome API tests pass: separate meter levels, deduplication, excluded muted preview, original-track preservation, dynamic participant tracks, mute/unknown gating, late permission cleanup, Pause/Resume timer/deadline, meeting/device/network/context failure, new-tab routing without a second toolbar click, untrusted sender rejection and no Start outside a joined call. Full existing suite: 106 tests pass. JavaScript syntax checks pass. No dependencies/build required for this standalone extension.

Real Chrome appearance/audio is unverified here. Chrome launch was already blocked in this restricted workspace (SIGABRT/EPERM); no browser-control connector is available. Tests use simulated tracks and audio samples, not real Meet audio. No production changes, deployment, commit or push.

References: browser media-element streams are described by https://www.w3.org/TR/mediacapture-streams/ and https://developer.chrome.com/blog/capture-stream/. These primitives do not promise access to Google Meet's implementation. There is deliberately no WebRTC interception or private Meet API hook in the prototype.
