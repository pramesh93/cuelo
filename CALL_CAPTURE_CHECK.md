# Check local call capture in desktop Chrome

This development screen checks capture and stopping only. It does not transcribe, generate answers, record audio or use provider credits. It has not been deployed. Automated checks used generated media and simulated ending signals; they do not prove real Meet closure or a physical microphone.

1. From this project folder run `npm run dev`, keeping the terminal open. Open the local address it prints, adding `/?view=capture-check` (normally http://127.0.0.1:5173/?view=capture-check).
2. Join a Google Meet call in another Chrome tab, preferably with another participant speaking. In Cuelo click **Connect call audio**. Select **Chrome Tab**, choose the Meet tab and enable **Share tab audio**. Allow the separate microphone request.
3. Cuelo should say meeting audio and microphone are connected. This confirms capture connections, not transcription or speaker recognition.
4. Switch to another Chrome window, then return. Cuelo should remain connected. Silence should also leave it connected.
5. Close the shared Meet tab, or use Chrome's **Stop sharing** control. Cuelo should report a disconnection and release both feeds. Check that Chrome's sharing and microphone indicators have cleared.
6. Connect again, then click **Pause**. Both feeds should turn off. **Reconnect audio** asks for capture permission again and retains the original session deadline. Click **Stop** to end the capture check.
7. Try selecting the tab without tab audio. Cuelo should explain the missing audio and release the selected tab. Denying microphone permission should also release the tab capture.

Leaving Meet while its tab remains open does not reliably end tab capture: click Cuelo's **Stop**. Keep the Cuelo page open during capture.

The 55-minute warning and 60-minute cutoff passed accelerated clock tests; a real hour-long call has not been checked. Browser controls alone cannot guarantee cleanup while Chrome is frozen. Paid live listening remains disabled until the secure streaming route and backend limits are ready.
