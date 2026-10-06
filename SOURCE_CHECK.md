# Check source management in desktop Chrome

Guest source management is deployed at https://deafening-frog-846.convex.site/?view=sources. These checks read and store source text in production Convex. They do not call Deepgram or OpenAI, generate answers, or change the existing answer limits.

1. Open https://deafening-frog-846.convex.site/?view=sources in desktop Chrome. For local development, run `npm run dev` and use http://127.0.0.1:5173/?view=sources.
2. Choose **Paste text**. Give it a source name, paste a short FAQ and click **Read source**.
3. Click **Inspect readable text**. Check that the text and references match what you supplied. Pasted text uses passage numbers; PDFs use their actual page numbers; webpages preserve actual headings when present.
4. Click **Replace source**, choose **Upload file**, and select a readable PDF or Word .docx file. Click **Replace source**. The previous source and its search entries are deleted only after the new source is successfully read.
5. Try **Public webpage** with one public https help-page link. Private pages, local addresses and entire-site searches are outside this version. If an import fails, the old source stays available.
6. Click **Delete source**. The source should disappear and the delete message should appear.

Files are limited to 10 MB and 50 pages. Text is limited to 200,000 characters and 500 passages; oversized inputs are refused rather than cut off. Scanned pages requiring OCR and older .doc files are not supported: export a readable PDF or .docx. Word's saved page count is used and labelled as reported by Word, rather than a freshly rendered count. If that count is missing, export a PDF. Word passages have passage references; PDF is the reliable choice for exact page citations.

Guest sources are temporary and expire after an hour. Access is denied after expiry; scheduled cleanup deletes the text and search entries. Original uploads are kept only while extracting text, then deleted; interrupted uploads also have expiry cleanup. Closing an unfinished visit relies on this expiry cleanup. Session-end cleanup will be connected when the practice/live sessions are implemented.

Google sign-in is not configured yet, so saving to an account has not been checked in Chrome. The account screen includes **Keep this source**, explicit replacement of a previous saved source, and document confirmation before Meet setup. Ownership, sign-in requirements, save consent and deletion have automated checks using made-up accounts. Saved sources remain until replaced or deleted; generic mode never selects an old source automatically.

Verified: real development Chrome paste, inspect, Word upload, replacement, failed private-link preservation, deletion and narrow layout; real Convex PDF/page extraction, public Slack-page import, nearly 10 MB Word upload, 51-page/oversized rejection and one-use upload permissions. No AI provider calls were made. After user confirmation, the guest Chrome flow also passed on the deployed production site, including paste, inspect, Word upload, replacement, failed private-link preservation, deletion and narrow layout. Signed-out Google setup correctly stays unavailable; the development capture screen is excluded. This does not verify answers from these new sources, Google sign-in or real Meet capture.
