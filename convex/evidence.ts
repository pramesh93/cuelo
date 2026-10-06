import { load } from "cheerio";

export const SOURCE_URL = "https://slack.com/help/articles/203772216-SAML-single-sign-on";
export const REFUSAL = "Not verified in this source";
export type Passage = { id: number; section: string; text: string };
export type Source = { title: string; url: string; passages: Passage[] };
export type Result = { status: "verified" | "unverified"; answer: string; excerpt: string | null; section: string | null };

export function assertDestination(url: string) {
  const parsed = new URL(url);
  if (parsed.origin !== "https://slack.com" || parsed.username || parsed.password || parsed.search || parsed.hash || !/^\/(?:intl\/en-[a-z]{2}\/)?help\/articles\/203772216-(?:SAML-single-sign-on|Set-up-SAML-single-sign-on-for-Slack)$/.test(parsed.pathname)) throw new Error("Unexpected source destination");
}
export function parseSource(html: string, url: string): Source {
  assertDestination(url);
  const $ = load(html);
  const title = ($("h1.article_title").first().text() || $("h1").first().text()).trim();
  const body = $(".article_body");
  if (!title || !body.length) throw new Error("Readable article text unavailable");
  const passages: Passage[] = [];
  let section = title;
  const clean = (s: string) => s.replace(/\s+/gu, " ").trim();
  body.find("h2,h3,p,li").each((_, el) => {
    if ($(el).closest(".boxed.roles").length) return;
    const text = clean($(el).text());
    if (/^h[23]$/.test(el.tagName)) section = text || section;
    else if (text && !$(el).parents("li").length) passages.push({id: passages.length, section, text});
  });
  // Availability is outside article_body on Slack's current page.
  const roles = $(".boxed.roles");
  roles.find("li").each((_, el) => {
    const text = clean($(el).text());
    if (text) passages.push({id: passages.length, section: "Who can use this feature?", text});
  });
  if (!passages.length) throw new Error("Readable article text unavailable");
  if (passages.map(p => p.text).join(" ").length > 24000) throw new Error("Article exceeds the 24,000-character evaluation limit");
  return {title, url, passages};
}

export async function fetchSource(): Promise<Source> {
  let url = SOURCE_URL;
  for (let hops = 0; hops < 5; hops++) {
    assertDestination(url);
    const response = await fetch(url, {redirect: "manual", signal: AbortSignal.timeout(15000)});
    if ([301,302,303,307,308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Missing redirect destination");
      url = new URL(location, url).href;
      assertDestination(url);
      continue;
    }
    if (!response.ok || !response.headers.get("content-type")?.includes("text/html")) {
      throw Object.assign(new Error(!response.ok ? `Slack article fetch returned HTTP ${response.status}.` : "Slack article response was not HTML."), {
        code: !response.ok ? "source_http_error" : "source_content_type_error",
        statusCode: response.status,
      });
    }
    const reader = response.body?.getReader();
    if (!reader) throw new Error("Article has no readable content");
    let bytes = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 2000000) { await reader.cancel(); throw new Error("Article exceeds the 2 MB fetch limit"); }
      chunks.push(value);
    }
    const merged = new Uint8Array(bytes);
    let offset = 0;
    for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.length; }
    return parseSource(new TextDecoder().decode(merged), url);
  }
  throw new Error("Too many article redirects");
}

export function checkResult(raw: unknown, source: Source, question = ""): Result {
  const refusal: Result = {status: "unverified", answer: REFUSAL, excerpt: null, section: null};
  if (!raw || typeof raw !== "object") return refusal;
  const value = raw as Record<string, unknown>;
  if (value.status !== "verified" || typeof value.answer !== "string" || !Array.isArray(value.passageIds)) return refusal;
  const answer = value.answer.trim();
  if (!answer || answer.split(/\s+/u).length > 40 || value.passageIds.length < 1 || value.passageIds.length > 3) return refusal;
  const passages = value.passageIds.map(id => source.passages.find(p => p.id === id));
  if (passages.some(p => !p) || new Set(passages.map(p => p!.section)).size !== 1) return refusal;
  const selected = passages as Passage[];
  // Return whole source paragraphs, never a model-written excerpt that might drop a condition.
  const excerpt = selected.map(p => p.text).join("\n\n");
  const subject = `${question} ${answer}`;
  if (/\bPro\b/i.test(subject) && /\bSSO\b|single sign.on/i.test(subject)) {
    const condition = source.passages.find(p => /\bPro\b/i.test(p.text) && /Salesforce/i.test(p.text));
    if (!condition || !selected.includes(condition) || !/Salesforce/i.test(answer) || !/\bif\b|\bonly\b|\brequires?\b/i.test(answer)) return refusal;
  }
  return {status: "verified", answer, excerpt, section: selected[0].section};
}
