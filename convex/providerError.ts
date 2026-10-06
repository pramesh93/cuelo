// Whitelist diagnostic fields. Never log the error object, request, headers or body.
export function safeProviderError(error: unknown, apiKey?: string) {
  const record = (value: unknown): Record<string, unknown> =>
    value !== null && typeof value === "object" ? value as Record<string, unknown> : {};
  const redact = (value: string) => {
    let text = apiKey ? value.split(apiKey).join("[REDACTED]") : value;
    text = text.replace(/sk-[A-Za-z0-9_.*-]+/g, "[REDACTED]")
      .replace(/Bearer\s+[^\s,;"']+/gi, "Bearer [REDACTED]");
    return text.slice(0, 1000);
  };
  let details = record(error);
  for (let depth = 0; depth < 3; depth++) {
    if (details.statusCode !== undefined || details.responseBody !== undefined || record(details.data).error) break;
    if (!details.cause) break;
    details = record(details.cause);
  }
  let provider = record(record(details.data).error);
  if (typeof details.responseBody === "string") {
    try { provider = {...provider, ...record(record(JSON.parse(details.responseBody)).error)}; } catch { /* Keep the SDK message for non-JSON errors. */ }
  }
  const code = provider.code ?? details.code;
  const message = provider.message ?? details.message;
  return {
    code: typeof code === "string" ? redact(code) : typeof code === "number" ? code : null,
    status: typeof details.statusCode === "number" && Number.isFinite(details.statusCode) ? details.statusCode : null,
    message: redact(typeof message === "string" ? message : typeof error === "string" ? error : "Unknown answer-call error"),
  };
}
