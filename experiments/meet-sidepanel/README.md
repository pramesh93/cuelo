# Cuelo side-panel feasibility — no AI

Isolated prototype for the approved flow: join Meet → click toolbar → vertical panel → choose source → Start → audio meter in the same panel. No floating window or automatic overlay. No provider/backend requests, saved audio, transcripts or generated answers. Two sample sources are fictional and local. This does not access your saved Convex source.

## Chrome check

1. Disable the earlier **Cuelo feasibility check — no AI** extension in chrome://extensions to avoid two prototypes operating together.
2. Load unpacked: /Users/avantikamishra/build-sprint-app/experiments/meet-sidepanel.
3. Join Google Meet with another participant. Click the new extension's toolbar icon (**Cuelo side-panel check — no AI**; tooltip Open Cuelo). The vertical Chrome side panel should open alongside Meet; no other panel/window should appear.
4. Choose Example sign-in FAQ or Example onboarding guide. Click Start once in the panel. Check the participant audio meter moves and the participant remains audible, with no tab-sharing picker or second activation.
5. Stop in the panel, or leave Meet while keeping its tab open. Status should show no capture. Capture also has a local 60-second test cutoff; do the departure check earlier than that.
6. Check changing sources before Start; selection is locked while capturing. Reopening the panel should recover active test status. No AI answers are expected in this unpaid prototype.
7. Disable/remove this prototype after checking. Do not use for customer calls.

Chrome/Meet checks are pending; actual Chrome launch was blocked earlier in the current restricted session. Prior real toolbar capture/floating/departure results were for the older prototype, not this exact side-panel flow.

## Automated checks

Run node experiments/meet-sidepanel/check.mjs. It simulates Chrome APIs and the panel DOM: toolbar opens panel and binds the original Meet tab, source validation precedes capture, only one capture is started, another tab cannot retarget active capture, departure/tab closure stop, source choice enables Start, and error polling does not erase action errors. These do not prove real permissions, Chrome layout or audio quality.

All 65 existing Cuelo tests also pass. Product code, provider settings, paid allowances and deployment are unchanged.

## Sequence checks after recovery fixes

Reload this extension in chrome://extensions, then close and reopen its sidebar.

- Open on a non-Meet tab, then join Meet in a new tab: only the toolbar-click message appears; source and Start remain hidden. Click the Cuelo toolbar on this Meet tab once to grant Chrome audio access. Source choices should then appear; choose a source to enable Start. Previously selected sources should remain selected.
- Open directly in a joined Meet: choose source and Start.
- Choose a source, switch to another tab, then return: retain the source; Start must not capture a different tab accidentally.
- Stop and Start again in the same joined meeting: retain the source.
- Leave or close Meet while capture is starting: capture must stay stopped.

These checks remain real-browser verification steps, not claims of observed success. Prototype captures only a local audio meter, with a 60-second cutoff and no generated answers.
