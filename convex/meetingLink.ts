// A link identifies the meeting. It never proves permission or connected audio.
export function normaliseMeetingLink(value: string): string | null {
  if (!value.trim()) return null;
  if (value.length > 256) throw new Error("Use a Google Meet link such as https://meet.google.com/abc-defg-hij.");
  let url: URL;
  try { url = new URL(value.trim()); }
  catch { throw new Error("Use a complete Google Meet link beginning with https://meet.google.com/."); }
  if (url.protocol !== "https:" || url.hostname !== "meet.google.com" || url.port || url.username || url.password || !/^\/[a-z]{3}-[a-z]{4}-[a-z]{3}\/?$/.test(url.pathname)) {
    throw new Error("Use a Google Meet link such as https://meet.google.com/abc-defg-hij.");
  }
  return `https://meet.google.com${url.pathname.replace(/\/$/, "")}`;
}
