# Cuelo UI review

Website: https://deafening-frog-846.convex.site/. Local preview: http://127.0.0.1:5173/. User approved building the UI from DESIGN.md before returning to Google sign-in/audio integration.

## Desktop Chrome

1. Open the preview. The approved headline, original violet blob, welcome answer card and microphone area should be visible on desktop. The microphone button is intentionally disabled, with a visible notice: no microphone is listening. Opening voice/general-answer integration is unfinished.
2. Scroll down. Navigation compresses from 96px to 68px. The call invitation has one calm action with no subtitle; the predefined hint appears in Cuelo's bubble when the invitation enters view. Click “Experience Cuelo on a call.”
3. On Practice call, choose the public Slack sample or “Upload my document,” then paste/upload/link a source and inspect it. Sources use the existing backend. Choosing the sample explicitly replaces the current temporary source. “Join practice call” is disabled: the three-question speaking-avatar/audio flow is unfinished.
4. Go back to Cuelo. Wait 20 seconds; Cuelo and its card can be moved together using the blob handle or arrow keys while the handle has keyboard focus. Reset position returns them to the start. Movement stays bounded around the conversation area to keep other content clear; this is not the operating-system floating window. Reduced motion disables automatic breathing/path/transitions; manual position controls remain available.
5. Check the source invitation, “Check an answer” in the footer and Log in. Source management, answer mode choice/evidence and account setup retain their existing functionality. The original Slack evaluation remains at /?view=evaluation. Google sign-in and paid answers retain their honest disabled states; they have not been activated by UI work.
6. Narrow the window. Reading order stays clear with no horizontal overflow. This does not prove mobile live-call support.

## Verification

Actual installed desktop Chrome automated checks passed across home, sources, answers, signed-out account and practice setup, with desktop/narrow screenshot inspection. Checks cover visible first-viewport microphone area, scroll compression, invitation/hint, unavailable controls, keyboard position/reset, reduced motion and no page errors/overflow. Real development backend imported the reported Slack admins URL through the redesigned source screen, inspected its actual headings/text and deleted only the test source. All 55 tests and the frontend build pass. No AI/transcription calls, secret changes or provider allowance increases.

Live reference DOM inspection covered Fluence/CRED. The sampled Fluence fixed navigation remained 104px before/after scroll; CRED had no semantic header/nav match in the sample. Cuelo's navigation compression follows the user's written approved brief, not a claim of reproducing their exact animations. Original code-based blob geometry is used; no external artwork copied. Exact customer-avatar artwork and the actual floating card remain unfinished.

A temporary disk-full interruption stopped one screenshot run. Only this task's generated screenshot files were removed; a subsequent run completed. No personal files or documents were deleted.

## Revised visual direction

The current preview replaces the rejected lavender canvas with a charcoal opening and a warm light call section. Scroll to see the illustrative animated call preview above the call invitation. Hover over the blob to see its curious eyes; idle eyes blink gently unless reduced motion is enabled. These are decorative expressions, not active-listening states. Desktop microphone bottom measured at 706.5px in a 900px viewport. Actual Chrome checked the new asset loads, invitation navigation, two eyes, reduced motion and desktop/narrow layout with no errors. Voice/practice functionality remains disabled; the preview is not a connected call or speaking avatar.

Current opening uses an actual original 3D background image, not just charcoal fill. Refresh the local preview and check the curved violet architectural edges behind the opening. Background is static; lower overlay protects control contrast. The old illustration below has been removed. Desktop/narrow asset loading and layout were checked in actual Chrome.

## Animated call preview

In desktop Chrome, refresh the website and scroll down to the call preview. The call window appears, audio bars move, and a floating card shows a prewritten example. Try Pause and Replay. No microphone or Meet audio is captured. Reduced motion shows the final example without automatic motion. Narrow layout is readable without horizontal overflow. This preview does not validate actual listening or AI response speed.

Production verification: npm run deploy published commit 28a62ca. Actual Chrome checks against the live URL passed animation phases, pause/replay, reduced motion, narrow answer-card containment and invitation navigation, plus source import/inspection/deletion and disabled paid-answer controls. No microphone capture, AI requests or page errors.
