import {test} from "node:test";
import assert from "node:assert/strict";
import {Agent} from "@convex-dev/agent";
import {ask} from "../convex/evaluation";

test("each question passes a fresh thread and removes it after success or failure", async (t) => {
  const originalKey = process.env.OPENAI_API_KEY;
  const originalSwitch = process.env.EVALUATION_TESTING_ENABLED;
  const created: string[] = [];
  const used: string[] = [];
  const removed: string[] = [];
  const ctx = {runMutation: async (_fn: unknown, args: Record<string, unknown>) => {
    if ("threadId" in args) {removed.push(args.threadId as string); return null;}
    if ("userId" in args) {
      const id = `temporary-thread-${created.length + 1}`;
      created.push(id); return {_id: id};
    }
    return true;
  }} as unknown as Parameters<typeof ask._handler>[0];
  t.mock.method(globalThis, "fetch", async () => new Response('<h1 class="article_title">Slack SAML</h1><div class="article_body"><p>Public sample text.</p></div>', {headers: {"content-type": "text/html"}}));
  t.mock.method(console, "error", () => {});
  t.mock.method(Agent.prototype, "generateText", async (_ctx: unknown, options: {threadId?: string}, _request: unknown, storage: {storageOptions: {saveMessages: string}}) => {
    assert.ok(options.threadId, "Specify userId or threadId");
    used.push(options.threadId);
    assert.equal(storage.storageOptions.saveMessages, "none");
    if (used.length === 2) throw new Error("Simulated provider failure");
    return {text: JSON.stringify({status: "unverified", answer: "Not verified in this source", passageIds: []})};
  });
  try {
    process.env.OPENAI_API_KEY = "fake-test-key";
    process.env.EVALUATION_TESTING_ENABLED = "true";
    const success = await ask._handler(ctx, {question: "Can you guarantee a custom integration by Friday?"});
    assert.equal(success.answer, "Not verified in this source");
    const failure = await ask._handler(ctx, {question: "Do you support SSO on the Pro plan?"});
    assert.equal(failure.answer, "Busy right now. Try again in a few minutes.");
    assert.deepEqual(created, ["temporary-thread-1", "temporary-thread-2"]);
    assert.deepEqual(used, created);
    assert.deepEqual(removed, created);
  } finally {
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = originalKey;
    if (originalSwitch === undefined) delete process.env.EVALUATION_TESTING_ENABLED; else process.env.EVALUATION_TESTING_ENABLED = originalSwitch;
  }
});
