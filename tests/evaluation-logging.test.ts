import {test} from "node:test";
import assert from "node:assert/strict";
import {Agent} from "@convex-dev/agent";
import {ask} from "../convex/evaluation";

test("logs the failed step and safe reason for setup, source and OpenAI failures", async (t) => {
  const originalKey = process.env.OPENAI_API_KEY;
  const originalSwitch = process.env.EVALUATION_TESTING_ENABLED;
  const logs: unknown[][] = [];
  t.mock.method(console, "error", (...args: unknown[]) => { logs.push(args); });
  const ctx = {runMutation: async () => true} as unknown as Parameters<typeof ask._handler>[0];
  try {
    process.env.OPENAI_API_KEY = "fake-test-key";
    process.env.EVALUATION_TESTING_ENABLED = "TRUE";
    let result = await ask._handler(ctx, {question: "Do you support SSO on the Pro plan?"});
    assert.equal(result.answer, "Real answers are not enabled yet. Set the provider key and enable evaluation testing in Convex.");
    assert.equal((logs.at(-1)?.[1] as {step: string}).step, "testing_switch_check");
    assert.match((logs.at(-1)?.[1] as {message: string}).message, /exactly true/);

    process.env.EVALUATION_TESTING_ENABLED = "true";
    const fetchMock = t.mock.method(globalThis, "fetch", async () => {throw new Error("Connection failed: fake-test-key");});
    result = await ask._handler(ctx, {question: "Do you support SSO on the Pro plan?"});
    assert.equal(result.answer, "The Slack article could not be read within the source limits. Try again or check the original article.");
    assert.deepEqual(logs.at(-1)?.[1], {step: "fetch_slack_article", code: null, status: null, message: "Connection failed: [REDACTED]"});

    fetchMock.mock.mockImplementation(async () => new Response("Blocked", {status: 403}));
    await ask._handler(ctx, {question: "Do you support SSO on the Pro plan?"});
    assert.deepEqual(logs.at(-1)?.[1], {step: "fetch_slack_article", code: "source_http_error", status: 403, message: "Slack article fetch returned HTTP 403."});

    fetchMock.mock.mockImplementation(async () => new Response('<h1 class="article_title">Slack SAML</h1><div class="article_body"><p>Public sample text.</p></div>', {headers: {"content-type": "text/html"}}));
    t.mock.method(Agent.prototype, "generateText", async () => {throw Object.assign(new Error("Quota exhausted: fake-test-key"), {statusCode: 429, data: {error: {code: "insufficient_quota"}}});});
    result = await ask._handler(ctx, {question: "Do you support SSO on the Pro plan?"});
    assert.equal(result.answer, "Busy right now. Try again in a few minutes.");
    assert.deepEqual(logs.at(-1)?.[1], {step: "openai_call", code: "insufficient_quota", status: 429, message: "Quota exhausted: [REDACTED]"});
    assert.equal(JSON.stringify(logs).includes("fake-test-key"), false);
  } finally {
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = originalKey;
    if (originalSwitch === undefined) delete process.env.EVALUATION_TESTING_ENABLED; else process.env.EVALUATION_TESTING_ENABLED = originalSwitch;
  }
});
