import { test } from "node:test";
import assert from "node:assert/strict";
import { safeProviderError } from "../convex/providerError";

test("keeps the provider code, status and message without logging request details", () => {
  const result = safeProviderError({
    statusCode: 429,
    message: "You exceeded your current quota.",
    responseBody: JSON.stringify({error: {code: "insufficient_quota", message: "You exceeded your current quota."}}),
    requestBodyValues: {prompt: "This must not reach logs"},
    responseHeaders: {authorization: "Bearer secret"},
  }, "secret");
  assert.deepEqual(result, {code: "insufficient_quota", status: 429, message: "You exceeded your current quota."});
});

test("redacts the configured key, masked OpenAI keys and bearer credentials", () => {
  const result = safeProviderError({statusCode: 401, data: {error: {
    code: "invalid_api_key", message: "Incorrect key: made-up-secret; sk-proj-example****; Bearer another-secret",
  }}}, "made-up-secret");
  assert.equal(result.code, "invalid_api_key");
  assert.equal(result.status, 401);
  assert.equal(result.message, "Incorrect key: [REDACTED]; [REDACTED]; Bearer [REDACTED]");
});

test("extracts a wrapped provider error and handles timeout errors", () => {
  assert.deepEqual(safeProviderError({message: "Wrapped", cause: {
    statusCode: 400, data: {error: {code: "model_not_found", message: "Model unavailable."}},
  }}), {code: "model_not_found", status: 400, message: "Model unavailable."});
  assert.deepEqual(safeProviderError(new Error("Request timed out")), {code: null, status: null, message: "Request timed out"});
});
