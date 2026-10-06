# Cuelo plan

This file was missing on 6 October 2026. Reconstructed only from PRODUCT.md and the user's approved milestone.

## Current milestone 1

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

## Parked

Everything outside milestone 1, including voice, uploads, login and live calls.

## Shipping gate

Shipping authorised on 6 October 2026. Public repository: https://github.com/pramesh93/cuelo. Production: https://deafening-frog-846.convex.site. Deploy with npm run deploy; git push does not deploy. Paid testing requires explicit activation and a provider key entered directly into Convex.
