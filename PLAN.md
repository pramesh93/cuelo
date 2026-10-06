# Cuelo plan

This file was missing on 6 October 2026. Reconstructed only from PRODUCT.md and the user's approved milestone.

## Shipped milestone 1

“I can type one evaluation question, and get either a short answer with the exact supporting excerpt from one public help article, or ‘Not verified in this source’.”

Source: https://slack.com/help/articles/203772216-SAML-single-sign-on

- Build a typed evaluation screen, separate from voice onboarding.
- Fetch only this public article on the backend; reject unexpected redirects and oversized sources.
- Generate with GPT-4.1, at most 40 words; return a source section and exact excerpt.
- Check excerpts against the fetched article. Refuse unsupported questions; preserve conditions.
- Check “Do you support SSO on the Pro plan?” preserves the Salesforce condition.
- Check “Can you guarantee a custom integration by Friday?” returns “Not verified in this source”.
- Verify in desktop Chrome and check narrow layout. The user authorised shipping on 6 October 2026.

## Later milestones (not authorised for this build)

Follow PRODUCT.md section 7: timed human practice; speech and channel separation; session controls and cutoff; speaking avatar, Google sign-in and invited live calls; repeat-use pilot; saved source.

## Confirmed milestone: spoken source evaluation

User explicitly redirected the next milestone on 6 October 2026 and approved the plan before implementation: speak one question into the site's microphone and receive the same sourced answer or “Not verified in this source”.

- Add Speak a question, Stop & answer, Cancel and truthful listening/transcription states; retain typed input.
- Capture at most 20 seconds; send canonical mono 16 kHz PCM audio through Convex to Deepgram Nova-3 English after Stop. No continuous connection or browser provider credential.
- Backend validates exact audio format, byte size (640,044 maximum) and duration before spending. Reserve $0.01 per speech attempt, at most 10 attempts per deployment; failures count, one in-flight transcription and no automatic retry. Existing answer allowance remains unchanged and is checked before transcription.
- Keep DEEPGRAM_API_KEY only in Convex environment variables. SPEECH_TESTING_ENABLED defaults off; activate real testing only after key/credits are available. Production settings remain separate.
- Use mip_opt_out=true on every Deepgram request. Store no audio/transcripts in Cuelo tables, file storage or application logs; provider request metadata remains separate.
- Show recognised text and invoke the existing evaluation.ask action unchanged. No new answering, retrieval or source checks.
- Stop or Cancel releases capture; late results after cancellation must not submit a question or reappear. Leaving the page cancels listening.
- Verify spoken supported/refusal questions with a physical microphone in desktop Chrome; label fake-device/provider tests as simulations. Report Stop-to-answer timings separately from existing backend-answer timing.
- The user confirmed that the microphone flow works in Chrome on 6 October 2026; release is authorised. No user-measured latency or detailed failure-check results were reported.

## Parked

Uploads, login, Meet listening, speaker separation, avatar and all other later milestones. The scoped microphone question flow above is authorised.

## Shipping gate

Shipping authorised on 6 October 2026. Public repository: https://github.com/pramesh93/cuelo. Production: https://deafening-frog-846.convex.site. Deploy with npm run deploy; git push does not deploy. Paid testing requires explicit activation and a provider key entered directly into Convex.
