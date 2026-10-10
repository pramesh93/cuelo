# Cuelo Chrome extension feasibility — 8 October 2026

Verdict: conditional fit for removing the repeated tab-sharing picker. The exact flow is not proven and cannot be promised through the supported extension APIs alone: an extension action is required for capture permission, and the current always-on-top floating-card API requires a user gesture.

No Cuelo application code, deployment, provider settings, paid allowances or production data was changed in this check. The isolated prototype is in experiments/meet-extension. It makes no network requests, records no audio, has no provider keys and does not generate answers. It processes a local live audio meter only when explicitly started and closes capture after 60 seconds.

## Evidence and limits

| Requirement | Evidence | Result |
| --- | --- | --- |
| Show a panel automatically on a Meet page | Chrome supports extension scripts restricted to meet.google.com; prototype implements that panel. | Supported mechanism; actual Chrome execution is untested. Opening a Meet page is not proof of joining a call. |
| Detect actual joining/leaving | Extension can observe the page. Prototype implements experimental English left/removed-screen recognition. | Not proven in real Meet; no official call-status integration implemented. Meet UI/localisation changes require maintenance. |
| No repeated sharing picker | Chrome tabCapture supports capturing an authorised tab without getDisplayMedia's picker. | Documented supported after extension invocation; real capture still untested here. |
| Prepare button alone on the automatically displayed panel | That click is not one of the documented activeTab-granting actions. | Do not promise it grants capture. Prototype compares this path against toolbar activation. |
| Automatically open always-on-top card | Document Picture-in-Picture rejects calls without user gesture. | Exact requirement blocked by documented rule. Automatically showing an in-Meet panel or ordinary popup is different from an always-on-top window. |
| Stop after leaving while Meet tab stays open | Extension can recognise the left-call screen and stop its owned stream. | Candidate approach, not guaranteed or tested against real Meet. Manual Stop remains a fallback. |
| Keep audio running while Cuelo page changes | Chrome supports a hidden extension document for capture. | Documented mechanism; prototype lifecycle is simulated only. It does not independently guarantee provider termination on a frozen process. |
| Keep participant audio audible locally | Tab capture otherwise suppresses normal playback; route captured audio to local output. | Implemented; local routing passes a simulated resource test, actual sound/echo untested. |

Capture permission is associated with invocation on the relevant tab, not simply installing the extension. Chrome lists toolbar action, extension keyboard shortcut, context menu and address-bar suggestion as invocation paths. Permission may persist within the same tab/origin; do not assume it covers new Meet tabs or all future meetings without testing.

## Checks performed

- Eight simulated orchestration/resource checks pass: denied invocation prevents capture, authorised simulated path creates the hidden document, duplicate capture is refused, leave signal stops, tab closure stops, non-Meet target is rejected, local audio output is connected, and accelerated cutoff releases tracks/context.
- JavaScript syntax checks pass.
- All 65 existing Cuelo automated tests pass using node --import tsx --test tests/*.test.ts (avoids restricted runner IPC).
- Attempted actual installed Chrome launch failed: browser process closed during startup under the current restricted session. No real browser, extension permissions, Meet participant audio, source selection, microphone separation, window switching, floating-card behaviour or screen-share visibility was verified.
- Initial resource-test assertion failed because objects created in a JavaScript sandbox have different prototypes; corrected the assertion to check the actual returned success value, then all eight checks passed.

The simulated permission flag is an injected test input, not proof that real Chrome authorises either path.

## Recommended flow to validate

1. Install Cuelo's extension once and sign in through the established Cuelo/Convex flow.
2. Meet opens; show a preparation panel automatically. Distinguish pre-join from a real call before beginning paid listening.
3. Choose generic/document mode and explicitly confirm a source in document mode.
4. Invoke Cuelo through its Chrome toolbar action or supported shortcut on the Meet tab to grant capture permission; no tab-sharing picker. Do not promise this step disappears unless real testing proves the selected interaction grants the required permission.
5. User click opens the always-on-top card; prove whether the setup can combine this with Prepare. Listen automatically only after preparation/admission.
6. Reuse Deepgram and the existing Convex question/answer/evidence services. Keep salesperson microphone separate. Capture alone does not fix the earlier unexplained no-answer failure.
7. Pause/Resume in the card; Stop on Cuelo page. Detect Meet departure, tab closure and local cutoff, clear current-call context, and explain failures honestly.

If automatically opening an always-on-top card before any click is non-negotiable, investigate a desktop companion separately. That route has not been tested or approved for implementation.

## Actual Chrome check still required

1. In chrome://extensions enable Developer mode, choose Load unpacked and select /Users/avantikamishra/build-sprint-app/experiments/meet-extension.
2. Open a fresh Meet tab with another participant. Do not first click the extension icon: use the automatically appearing panel's Test Prepare-only capture. Note whether Chrome denies it. This test intentionally compares an ungranted tab.
3. Pin/open the Cuelo feasibility toolbar icon while the Meet tab is active; click Prepare after toolbar action. The audio meter should change while the other participant speaks, without a sharing picker. Confirm you can still hear them. No AI/transcription occurs.
4. Stop; repeat locally if needed. Each started probe has a 60-second automatic cutoff and consumes no provider allowance.
5. Use Test floating window to check whether Picture-in-Picture is available from Meet's extension-injected panel after a user click. This may fail if Chrome isolates that interface; it is not yet proven.
6. Leave Meet while keeping the tab open. Check that the probe stops and no audio meter remains active. Also test tab closure and switching windows. Unknown Meet page states are not treated as reliable call-end signals.
7. Disable/remove the feasibility extension after checking. It is not a production product, has no saved source/account/AI integration, and should not be used for customer calls.

## Official references checked

- Capture, invocation, playback and hidden-document stream IDs: https://developer.chrome.com/docs/extensions/reference/api/tabCapture
- Explicit actions granting activeTab: https://developer.chrome.com/docs/extensions/develop/concepts/activeTab
- Supported background capture example: https://developer.chrome.com/docs/extensions/how-to/web-platform/screen-capture
- Restricted site scripts: https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts
- Floating-window user gesture requirement: https://developer.chrome.com/docs/web-platform/document-picture-in-picture
- Hidden extension documents: https://developer.chrome.com/docs/extensions/reference/api/offscreen

Next step: perform the unpaid, local Chrome/Meet probe above before approving a full extension rebuild or promising the exact automatic flow.

## User observation and revision — 8 October

User loaded the prototype and confirmed the panel appeared on Meet home. Original panel code mounted unconditionally; that proved page injection, not call detection. Reproduced the home-page error in a simulated DOM test before changing it. Revised the panel to wait for a visible English Leave call/Leave meeting control, hide on home/pre-join screens, remove on departure, and send a stop signal for recognised left/removed screens. Six simulated lifecycle cases now pass (home, pre-join, joined, departure, repeated departure and rejoin), alongside the eight earlier orchestration checks. Real Meet selector compatibility remains pending the user's reloaded-extension check. Unknown/localised UI states do not display the panel; this heuristic is not an official Meet call event.

User subsequently confirmed joined-call-only display in real Meet. Prepare-only capture showed Idle/no capture, but that is inconclusive: prototype status polling overwrote action errors. A failing simulated test reproduced this, and both panel/toolbar now retain the last action error during polling. Repeat the real permission check after reloading; no claim of successful or denied audio capture yet.

## Real user-operated Chrome results — 8 October

User confirmed the revised panel appears after joining Meet. On a fresh invocation attempt, Prepare-only returned Chrome's actual error: “Extension has not been invoked for the current page (see activeTab permission). Chrome pages cannot be captured.” After clicking the Cuelo toolbar icon and Prepare after toolbar action, user confirmed the audio meter moves when the other participant speaks. This is real participant-audio capture evidence, not a simulation. It confirms the tested panel-only path fails and toolbar-activated capture receives audio. It does not verify transcription/answers, salesperson microphone separation, audio playback/echo quality, automatic departure stopping, frozen-page behaviour or floating-window availability. Those remain pending; no provider calls were made by this prototype.

## Final user-operated feasibility results — 8 October

User confirmed Test floating window opens a separate window from the joined-Meet panel. User then followed the departure check (restart capture, observe participant audio, leave within 15 seconds while keeping the Meet tab open) and reported “Stopped; no capture” in the toolbar popup. This supplies real user-operated evidence for floating-window opening after a click and recognised departure stopping in this tested Meet interface, before the prototype's 60-second cutoff. It does not prove every Meet UI/locale, removal/reconnection/background state or provider shutdown; no provider stream exists in this probe.

Recommendation: proceed with a Chrome extension if the user accepts explicit toolbar activation for the target Meet tab and a click to open the floating card. Automatically display source/mode preparation in Meet; invoke extension on that tab; use a Prepare click to open the card and start admitted listening. Consolidating the currently separate probe buttons into that final Prepare flow remains implementation/testing work. Keep existing Convex backend, Google sign-in, source/evidence policy, Deepgram and GPT-4.1. Add the approved floating Pause/Resume and main-page Stop; departure stopping keeps manual fallback and the 60-minute controls. No actual question transcription or generated answers were tested, and the original website no-answer failure remains unresolved. A final integration plan requires approval before product changes; no product/backend/settings/deploy changes are authorised by this feasibility result alone.

## Revised single-side-panel flow — 8 October

User explicitly changed the desired flow: toolbar click opens a vertical Chrome side panel, list/select one source, click Start, capture audio and show answers in that same panel. No automatically injected preparation panel, separate activation/preparation click or floating window. Official sidePanel and tabCapture APIs support this mechanism; exact combination remains to be tested.

Created a separate unpaid prototype in experiments/meet-sidepanel, retaining the earlier experiment for comparison. Chrome toolbar action opens the native side panel and remembers the invoked Meet tab; Start uses that tab's capture grant. Two fictional sample sources demonstrate selection only. The panel contains a local audio meter and an explicitly unconnected answer area. No provider/backend integration. Simulated Chrome/DOM checks pass for source selection, toolbar-bound capture, duplicate prevention, active-tab retarget protection, error retention and departure/tab-close cleanup. All 65 product tests pass. User must disable the earlier prototype, load this one, and check real Chrome panel opening, layout, capture with one Start and no picker. Earlier real audio proof is not proof of this revised side-panel combination.

Official side-panel reference: https://developer.chrome.com/docs/extensions/reference/api/sidePanel

## Side-panel user result and admission repair — 8 October

User confirmed the exact side-panel prototype captures participant audio and shows Meeting ended/no capture on leaving. User also found Start could capture while not joined. Root cause: the worker validated only a Meet tab URL, and the panel enabled Start from remembered tab selection. Added a fresh joined-call check through the Meet content script before obtaining a capture ID and exposed the joined state to the panel. Before joining, Start is disabled and status asks the user to start/join a call; joining enables Start when a source is selected. A failing simulated regression reproduced the original admission error; revised worker/UI checks and all 65 existing tests pass. Real Chrome gate verification still requires extension reload plus Meet refresh because the content-script message listener changed. Existing English Meet control detection remains heuristic; failure to recognise a joined call denies capture rather than guessing.

## Pre-call panel issue — 8 October

User reported choosing a source before starting a meeting left Start disabled; reopening the extension on the meeting tab worked but required reselection. Fixed fictional source selection retention across side-panel recreation using extension session storage; a failing simulated persistence regression now passes, and restoration is explicitly tested. The remaining admission issue needs clarification about same/new Meet tab. The worker intentionally captures the tab where the toolbar action granted permission; recognising a new Meet tab does not automatically grant capture permission for it. Do not silently retarget or claim pre-call activation on a different tab authorises the later meeting. Await user's tab clarification.

Pre-call clarification: user initially opened the panel on Google, then created a new Meet tab. Chrome invocation on Google does not authorise that new Meet tab. The revised prototype automatically recognises joined-call controls in the visible tab of the panel's window while idle; it no longer stays stuck querying the original non-Meet page. Outside a ready call, source/Start/audio/answer sections are hidden. On a newly joined, uninvoked Meet tab it says Meeting detected and asks for the toolbar action on that tab; controls appear after that permission step. Previously chosen sample source is retained. Simulated tests prove new-tab recognition does not fabricate permission and prove controls are hidden outside calls. Real updated UX remains pending. The intended join-Meet-first → toolbar → source → Start flow still needs only the one toolbar action; opening the panel on an unrelated page before creating Meet does not eliminate that later action.

Source visibility correction: joined-call detection now shows source choices immediately, independently of tab-capture permission. Start still requires the toolbar grant on that Meet tab; the UI explains this rather than hiding preparation. A failing simulated test reproduced the earlier conflation and now passes. No actual browser verification of this final source-visibility change yet.

Source re-selection follow-up: a delayed-save test reproduced another gap, where a recreated panel reads storage before the previous selection finishes saving. It now retries source restoration during status refresh, while preserving explicit choices made in the current panel and the active source. Simulation passes; the user's actual repeated-selection case still needs verification after reload. Disabled Start on a new Meet tab before invoking the extension there remains a Chrome permission requirement, not a gate to bypass.
