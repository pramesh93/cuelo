# Sidebar opening and Start: separate testing, 9 October 2026

User approved the plan. Changes are local, development-only; no provider calls, paid settings, allowance resets, deployment, commit or push.

## Implemented, not yet observed in real Chrome

- Meeting detection no longer hides sign-in/source setup just because capture permission belongs to another tab.
- The sidebar tracks its original browser window, avoiding the Google sign-in popup becoming the meeting window.
- Account restoration remains a separate loading state. Chrome credential-change events now reach Convex Auth's storage listener, so a credential renewed/removed by another extension context can update the sidebar. Website and extension sign-ins remain separate; dev and production remain separate.
- Source selection and adding remain in the sidebar. Import completion selects the new source and collapses the form. Source inspection/replacement/deletion remain on the website; answer evidence is preserved.
- Disabled Start explains capture permission, invitation, testing activation, mode, source loading/selection or connection-in-progress. Generic mode needs no source.

## Unresolved audio dependency

The current Start still requests extension-origin microphone access. It has NOT been changed to the proposed Meet-origin audio route. The user confirmed no sidebar permission prompt appeared. Meet permission cannot automatically grant permission to chrome-extension://. Reading the microphone from the Meet page is a candidate, not verified. It must also prove mute handling, device changes, background windows and bounded separate audio forwarding before provider integration.

Chrome requires invocation on the target tab for tabCapture. A toolbar invocation on an unrelated tab does not authorise a new Meet tab. The source screen can appear automatically, but Start currently remains blocked if the joined Meet has not been authorised. Do not claim the requested no-extra-click flow works in every tab order.

## Unpaid browser check

1. In chrome://extensions, reload Cuelo — development from extension/meet. Reload Meet, then join a call with Meet microphone permission already allowed. Confirm the sidebar says Test version. Do not click Start during this check.
2. With the sidebar open, right-click inside it and choose Inspect. Open Console. Paste this exact line (it contains no keys):

```js
console.log(await chrome.runtime.sendMessage({type:'audio-feasibility'}))
```

3. The result reports meeting, microphone, tabAudio and paidSessionStarted:false. It opens no tabs/windows, never asks for a new microphone grant, immediately stops any probe microphone, and obtains only an unused short-lived tab stream identifier. No audio is recorded or sent to any provider. A delayed microphone is stopped even after the five-second timeout.
4. First run: Meet first → toolbar → sidebar. Then run: open sidebar on an unrelated tab → create/join Meet in a new tab in the SAME browser window → return to the sidebar console and run the line, without clicking the toolbar again. Send only these result objects; do not send other console output or credentials.

Interpretation:
- microphone:existing-permission-works proves an existing permission can open and release a microphone in the content-script context on this browser. It does not prove ongoing audio transport, speaker separation, muted speech or background capture.
- prompt/denied means the probe made no microphone request. permission-not-reused means capture was rejected despite the permission check. detector-unavailable means reload the Meet page after reloading the extension.
- tabAudio:authorised means Chrome issued a target-tab identifier; capture still needs consuming/testing. not-authorised means this opening sequence lacks Chrome's required invocation permission (or another capture error); it is not a paid allowance issue.

## UI checks, no Start needed

- Joined Meet first → toolbar: remembered extension sign-in should lead to answer mode/source selection; a genuinely signed-out account shows Continue with Google.
- Sidebar first → Meet home/lobby: no source/Start. Join the meeting: account/source screen appears automatically. Chrome may still block Start for missing target-tab authorisation; report the exact displayed reason.
- Reopen sidebar; switch browser windows; finish/cancel Google sign-in: original sidebar window should stay correctly associated.
- Select existing source: ready message, no inspect/replace/delete controls. Add public text/link: new source selected automatically, form closes. No automatic source saving is introduced.

## Validation

Browser launch failed in the restricted workspace (Chrome SIGABRT; process permissions EPERM). Automated Chrome API/provider objects are simulations. All local tests and extension/website builds must pass before handoff; actual Chrome sign-in/audio observations remain pending. Production is not published.
