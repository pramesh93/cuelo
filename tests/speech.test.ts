import {test} from "node:test";
import assert from "node:assert/strict";
import {encodeQuestionAudio} from "../src/audio";
import {validateQuestionAudio} from "../convex/speechAudio";
import {transcribe} from "../convex/speech";

const question = "Do you support SSO on the Pro plan?";
const audio = () => encodeQuestionAudio(new Float32Array(16000).fill(0.05));

test("server enforces actual PCM format, byte size and duration before provider spending", () => {
  assert.equal(validateQuestionAudio(audio()), 1);
  assert.throws(() => validateQuestionAudio(new ArrayBuffer(0)));
  assert.throws(() => validateQuestionAudio(encodeQuestionAudio(new Float32Array(320001).fill(0.05))));
  const forged = audio();
  new DataView(forged).setUint32(24, 8000, true);
  assert.throws(() => validateQuestionAudio(forged));
  const mismatch = audio();
  new DataView(mismatch).setUint32(40, 2, true);
  assert.throws(() => validateQuestionAudio(mismatch));
});

test("Deepgram uses the backend key, Nova-3 English and retention opt-out; returns text only", async t => {
  const previous = {key: process.env.DEEPGRAM_API_KEY, enabled: process.env.SPEECH_TESTING_ENABLED};
  const reservations: unknown[] = [];
  const ctx = {runMutation: async (_fn: unknown, args: unknown) => {reservations.push(args); return "ready";}} as unknown as Parameters<typeof transcribe._handler>[0];
  process.env.DEEPGRAM_API_KEY = "fake-test-key";
  process.env.SPEECH_TESTING_ENABLED = "true";
  const fetch = t.mock.method(globalThis, "fetch", async (url: string | URL | Request, init?: RequestInit) => {
    const requestUrl = new URL(String(url));
    assert.equal(requestUrl.searchParams.get("model"), "nova-3");
    assert.equal(requestUrl.searchParams.get("language"), "en");
    assert.equal(requestUrl.searchParams.get("mip_opt_out"), "true");
    assert.equal(new Headers(init?.headers).get("Authorization"), "Token fake-test-key");
    assert.equal(validateQuestionAudio(init?.body as ArrayBuffer), 1);
    return Response.json({results:{channels:[{alternatives:[{transcript:question, confidence:0.95}]}]}});
  });
  try {
    const result = await transcribe._handler(ctx, {audio:audio()});
    assert.equal(result.status, "ok");
    assert.equal(result.transcript, question);
    assert.equal(reservations.length, 2, "reservation is released after success");
    fetch.mock.mockImplementation(async () => Response.json({results:{channels:[{alternatives:[{transcript:"",confidence:0}]}]}}));
    assert.equal((await transcribe._handler(ctx,{audio:audio()})).status, "error");
    fetch.mock.mockImplementation(async () => new Response("private-provider-body", {status:429}));
    const failed = await transcribe._handler(ctx,{audio:audio()});
    assert.equal(failed.message, "Busy right now. Try again in a few minutes.");
    assert.equal(JSON.stringify(failed).includes("private-provider-body"), false);
    assert.equal(reservations.length, 6, "failure also releases the reservation");
  } finally {
    if(previous.key === undefined) delete process.env.DEEPGRAM_API_KEY; else process.env.DEEPGRAM_API_KEY=previous.key;
    if(previous.enabled === undefined) delete process.env.SPEECH_TESTING_ENABLED; else process.env.SPEECH_TESTING_ENABLED=previous.enabled;
  }
});

test("disabled testing, exhausted allowance and malformed audio never call Deepgram", async t => {
  const previous = {key:process.env.DEEPGRAM_API_KEY,enabled:process.env.SPEECH_TESTING_ENABLED};
  let calls = 0;
  t.mock.method(globalThis,"fetch",async () => {calls++; throw new Error("must not run");});
  const ctx = {runMutation: async () => "exhausted"} as unknown as Parameters<typeof transcribe._handler>[0];
  try {
    process.env.DEEPGRAM_API_KEY="fake-test-key";
    process.env.SPEECH_TESTING_ENABLED="false";
    assert.equal((await transcribe._handler(ctx,{audio:audio()})).status,"error");
    process.env.SPEECH_TESTING_ENABLED="true";
    assert.match((await transcribe._handler(ctx,{audio:audio()})).message,/allowance/i);
    assert.equal((await transcribe._handler(ctx,{audio:new ArrayBuffer(12)})).status,"error");
    assert.equal(calls,0);
  } finally {
    if(previous.key === undefined) delete process.env.DEEPGRAM_API_KEY; else process.env.DEEPGRAM_API_KEY=previous.key;
    if(previous.enabled === undefined) delete process.env.SPEECH_TESTING_ENABLED; else process.env.SPEECH_TESTING_ENABLED=previous.enabled;
  }
});
