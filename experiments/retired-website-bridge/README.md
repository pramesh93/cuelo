# Cuelo extension integration — development, not yet verified live

Chrome sidebar controls and displays real Cuelo answers using the existing website and Convex functions. It is separate from the unpaid feasibility prototypes. No fake answers, sample-source shortcuts, recordings or provider keys. Current configuration opens http://127.0.0.1:5173; the hosted websites have not been deployed with this integration.

## Desktop Chrome check

1. Run `npm run dev` from the project folder. Keep it running at http://127.0.0.1:5173. The existing development Convex deployment and its Google callback must remain configured. No backend changes are needed for this integration.
2. At chrome://extensions, disable both old Cuelo feasibility prototypes. Turn on Developer mode, choose Load unpacked and select `/Users/avantikamishra/build-sprint-app/extension/meet`. New name: **Cuelo — development**. Loading the old experiments folder will keep showing the old meter-only prototype.
3. Join a Google Meet call and click this extension’s toolbar icon. The sidebar opens. On first connection the Cuelo website opens for Google sign-in. Sign in if needed and keep this tab open; return to Meet afterward. A restored browser sign-in is reused. If Cuelo has disconnected, the sidebar’s Connect Cuelo button opens/reconnects this tab.
4. In the Cuelo website use Add or replace your saved source if needed. There is one saved source in v1, not a collection of multiple documents. Return to the Meet sidebar, explicitly choose Answers from my document and select that source. Alternatively explicitly choose Generic answers, with no source required.
5. Click Start once. If Chrome requests Cuelo’s microphone permission, allow it in the Cuelo tab. Return to Meet. No tab-sharing picker or Prepare step is involved. Account invitation, source ownership, original call deadline, spending reservation and existing test allowances are checked by Convex; denial never bypasses them. An exhausted allowance is a real blocker, not grounds to reset it.
6. Have a participant on another computer ask one made-up/public-source question supported by the selected source, then one unsupported question. Check the answer, citation and supporting passage; unsupported questions should safely refuse. In generic mode every result must visibly say Not from your document. Measure time from the end of the question to the answer yourself; the card’s Answer processing time excludes speech recognition.
7. Speak a question yourself: your microphone should add context but not trigger an answer. Headphones help keep customer audio out of your microphone. Ask another customer question while an answer is pending; the older pending answer must be cancelled.
8. Pause releases tab capture, microphone and speech connections. Resume uses the same session deadline and transcript. A resume uses another connection from the existing connection allowance; the current bounded test may not allow further resumes. Stop clears current-call content and shuts listening off. The Cuelo website also has Stop Cuelo while a session is active.
9. Leave Meet while keeping the tab open, close the Meet tab, or close the Cuelo website: listening should stop. Switching to another tab/window should continue listening to the original Meet. Reopening the sidebar during capture should show current status/answer. Starting on a new Meet tab still requires its own toolbar invocation.
10. Check the participant screen-share view; sharing the whole screen may expose the sidebar. Test microphone refusal and the existing 55/60-minute cutoff independently. Do not claim the full milestone complete before those checks.

## Implementation boundary

The website handles Google sign-in, the salesperson microphone, short-lived Deepgram credential, Nova-3 connections, and the existing Convex append/detection/retrieval/answer service. The extension captures only the authorised Meet tab, restores local sound, forwards bounded 50ms PCM frames and displays account/source/status/answer metadata over a restricted Chrome message port. Only the named local, development Convex and production Convex origins and exact bridge route are accepted. Provider/authentication credentials never cross to the extension. Frames, transcripts and answers are not saved in extension storage; only the source/mode preference, target tab identifiers and public connection origin are saved.

The offscreen audio component has a local deadline and stops if Cuelo stops acknowledging audio for five seconds. These browser controls do not replace the parked independent relay or guarantee shutdown if the whole browser/process fails. Provider retention, external relay enforcement and measured performance remain as documented previously; no new service or paid setting was enabled here.

## What has actually been checked

Automated tests simulate Chrome APIs, website sockets, audio graph and sidebar DOM. They verify access/route checks, source validation, original-tab targeting, bounded PCM, customer vs microphone handling, source persistence, citations, generic provenance, refusal rendering, startup cancellation and connection-loss shutdown. They are not proof of real Meet audio, browser permissions, sign-in or answer accuracy. Real Chrome execution is unavailable in the current restricted session; user-operated live verification remains pending. This integration has not been committed, pushed or deployed.

Run `node --import tsx --test tests/*.test.ts` and `npm run build` for repeatable local checks.

Chrome references: https://developer.chrome.com/docs/extensions/develop/concepts/messaging and https://developer.chrome.com/docs/extensions/reference/api/tabCapture.
