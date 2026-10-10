# Four-question Google Meet check

Use only this made-up example source. Do not use customer or confidential information for this test.

## Source to paste into Cuelo

Title: Example product sign-in FAQ

Password sign-in
The example product supports password sign-in. Password sign-in is available on every plan.

Single sign-on
Single sign-on is available only if a Salesforce account is connected.

## Questions for the second participant

Ask each question aloud through Meet. Cuelo should hear the other participant, not trigger from the salesperson's microphone.

| Question | Expected result |
| --- | --- |
| 1. Is password sign-in available on every plan? | Yes; cite the password sign-in passage. |
| 2. Can you give me a twenty percent discount? | “I couldn't find this in your source.” No invented discount. |
| 3. When is single sign-on available? | Only if a Salesforce account is connected; cite that passage. |
| 4. Can we use that without connecting Salesforce? | No; retain the Salesforce requirement and understand “that” from the current discussion. Cite the supporting passage. |

For question 4, move to a different Chrome window before the participant asks. Cuelo should keep listening. If an earlier answer is still processing, ask question 4 and confirm the old answer does not replace the new one.

The salesperson can say “Let's discuss sign-in” between questions. That speech should provide context and must not cause an answer.

After the questions, click Stop. Check Chrome's microphone/tab-sharing indicators turn off. More speech should produce no new answers. Leaving Google Meet while its tab stays open may require manually clicking Stop in Cuelo.

If testing alone, join Meet from a phone as the other participant and ask the questions there. Use computer headphones to avoid echo. Keep the phone's sound low or muted without muting its microphone.

## Record only outcomes

Report whether each answer matched, whether window switching worked, whether salesperson speech caused an unwanted answer, and whether Stop turned off capture. Do not save the call transcript or audio. Speed comparisons remain parked.

## Test allowance

One development session, maximum four generated answers, twenty question-detection checks, two connection grants (initial connection and one Pause/Resume), and a ₹500 reservation within the existing ₹5,000 monthly budget. The reservation is an estimate, not a provider charge or an independently enforced termination of a frozen browser's connection. Existing prototype allowances are not reset.

## Provider data rules checked 7 October 2026

The browser requests Deepgram's `mip_opt_out=true`; its current documentation says opted-out audio/transcripts are retained only while processing. After a real connection, verify that flag in Usage → Logs. [Deepgram data controls](https://developers.deepgram.com/trust-security/your-data).

OpenAI requests use `store:false`. That does not remove OpenAI's default abuse-monitoring retention, which can retain request content for up to 30 days. Account-specific zero-retention approval has not been verified. Use the made-up example above. [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data).
