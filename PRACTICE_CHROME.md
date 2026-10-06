# Cuelo conversation-attention practice

Goal: use a correct source-based answer without missing what the customer says next. Start with the four-round first pass requested by the user. This is a human practice, not a demonstration of automatic Meet listening. The original six-round milestone is not claimed complete by this smaller run.

## Before starting

- Two people sit together: you are the salesperson; a colleague is the customer and checker. An optional third person can time and write the scores.
- Use desktop Chrome and https://deafening-frog-846.convex.site. Keep Cuelo in the active tab throughout each round. Allow the microphone when asked; do not record the call or screen.
- Give your colleague PRACTICE_CUSTOMER.md and PRACTICE_CHECKER.md. Do not read the checker guide or customer detail list in advance. Keep PRACTICE_SCORE.csv for the results.
- Use only the scripted, fictional practice details and the public Slack article. Do not enter real customer names, documents or private conversations.
- For the authorised speed retest on 6 October 2026, the live deployment has used ten of fourteen answer attempts and six of ten speech attempts. Four answers and four speech attempts remain. The user checked provider limits and approved four additional answer attempts; the speech limit and historical counters remain unchanged. This leaves no spare answer attempts for warm-ups or retries. Do not reset usage counts or retry to get a nicer result. Someone else using the public site can consume the shared allowance; stop and record an incomplete run if it runs out.

## The 30-minute session

First 5 minutes: open Cuelo, check the mic permission without submitting a warm-up answer, assign the roles and put a stopwatch within reach. The colleague quietly reviews the checker guide. Use a timer that does not require leaving Cuelo's tab while the mic is on.

Next 15 minutes: work through the four questions in the colleague's script. For each round:

1. You click **Speak a question**. Wait until Cuelo visibly says **Listening**. The colleague then reads only that round's question into the microphone.
2. The colleague starts the stopwatch at the end of the spoken question. You immediately click **Stop & answer**. If there is an observer, they note the delay from the question ending to that click.
3. Wait for the **Microphone off** message. While you wait for or read the answer, the colleague says the round's extra detail. This is not another question; Cuelo will not capture it. The colleague does not ask the next question yet.
4. The timer stops when the complete, usable answer is visible. Record that total time, including the delay before clicking Stop. Also record the site's **Stop to answer** reading separately. The site's **Measured response** is backend answer time only.
5. Respond to the customer in your own words using the answer, or say the source cannot verify the promise. Immediately repeat the extra detail you heard. The colleague scores this first recall; do not repeat the detail beforehand or prompt you.
6. The colleague notes whether you used the answer and whether the customer had to repeat anything. Wait until Cuelo's **Speak a question** button is available before beginning the next round.

If recognition is wrong, a provider fails, the allowance is exhausted or capture cannot start, record what happened. Do not quietly type a corrected question or rerun the round and count it as the first attempt. A setup failure makes the session incomplete; a later retry is a separately identified attempt requiring available allowance.

Next 5 minutes: the colleague checks every response against the public article, including the exact supporting excerpt and its cited section. Check all qualifications and that each supported answer stays within 40 words, excluding the citation. The unsupported question must display **Not verified in this source** with no invented evidence. Record only check results, timing and fictional detail recall; do not save speech, transcripts or answer history.

Last 5 minutes: total the score and note the main failure, if any.

## First-pass rule

All four rounds must finish. The two straightforward questions must be correctly supported; the unsupported promise must be refused; the conditional question must preserve the Salesforce requirement. Every response must appear within five seconds of the spoken question ending. You must recall the added detail correctly in all four rounds and use both straightforward answers. Record whether you used the conditional answer too.

Correct refusal is a safety success, not a useful factual answer. An unnecessarily refused supported question fails correctness. Missing time or recall results mean the first pass is not yet proven. If the trial misses a condition, diagnose that result before adding new features; do not mark a partial run as a pass. Report a successful result as a four-round first pass, not completion of the original six-round milestone. Questions C and D in the checker guide are parked for a later expanded run with an approved allowance.

This practice evaluates question capture, answer correctness, total delay and human attention with manual Stop. It does not test Meet tab audio, speaker separation, continued listening, cancellation by a new customer question or the floating window.

## What to report back

Use the four rows in PRACTICE_SCORE.csv. Tell Codex which rows passed, their total times, whether all four extra details were recalled, and which supported answers you used. Do not send recordings, private conversation text or real customer information. The full milestone remains pending; this run supplies the first human evidence.
