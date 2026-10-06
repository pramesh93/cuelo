import {test} from "node:test";
import assert from "node:assert/strict";
import {normaliseMeetingLink} from "../convex/meetingLink";
import {get, save} from "../convex/accountSetup";

test("Meet links identify a meeting, strip query credentials and reject other destinations", () => {
  assert.equal(normaliseMeetingLink(""), null);
  assert.equal(normaliseMeetingLink(" https://meet.google.com/abc-defg-hij/?authuser=2#secret "), "https://meet.google.com/abc-defg-hij");
  for (const link of ["javascript:alert(1)", "http://meet.google.com/abc-defg-hij", "https://meet.google.com.evil.example/abc-defg-hij", "https://meet.google.com@evil.example/abc-defg-hij", "https://user:password@meet.google.com/abc-defg-hij", "https://meet.google.com:444/abc-defg-hij", "https://meet.google.com/", "abc-defg-hij", "x".repeat(257)]) {
    assert.throws(() => normaliseMeetingLink(link), /Google Meet/);
  }
});

test("call setup requires sign-in and scopes every saved choice to its account", async () => {
  let subject: string | null = null;
  const rows = new Map<string, {_id:string; userId:string; mode:"generic"|"document"; meetingUrl:string|null; updatedAt:number}>();
  const ctx = {
    auth: {getUserIdentity: async () => subject ? {subject} : null},
    db: {
      query: () => ({withIndex: (_name: string, select: (q: {eq: (field: string, value:string) => unknown}) => unknown) => {
        let owner = "";
        select({eq: (_field, value) => {owner=value; return {};}});
        return {take: async () => rows.has(owner) ? [rows.get(owner)] : []};
      }}),
      insert: async (_table: string, row: Omit<NonNullable<ReturnType<typeof rows.get>>, "_id">) => {rows.set(row.userId, {_id:row.userId,...row});},
      patch: async (id: string, value: object) => {Object.assign(rows.get(id)!, value);},
    },
  } as unknown as Parameters<typeof save._handler>[0];
  assert.equal(await get._handler(ctx, {}), null);
  await assert.rejects(() => save._handler(ctx, {mode:"generic", meetingUrl:""}), /Sign in/);
  assert.equal(rows.size, 0);
  subject = "made-up-account-a|made-up-session";
  await save._handler(ctx, {mode:"generic", meetingUrl:"https://meet.google.com/abc-defg-hij?authuser=2"});
  assert.deepEqual(await get._handler(ctx, {}), {mode:"generic", meetingUrl:"https://meet.google.com/abc-defg-hij"});
  subject = "made-up-account-b|made-up-session";
  assert.equal(await get._handler(ctx, {}), null);
  await save._handler(ctx, {mode:"document", meetingUrl:""});
  assert.deepEqual(await get._handler(ctx, {}), {mode:"document", meetingUrl:null});
  subject = "made-up-account-a|made-up-session";
  await assert.rejects(() => save._handler(ctx, {mode:"document", meetingUrl:"https://evil.example"}), /Google Meet/);
  assert.deepEqual(await get._handler(ctx, {}), {mode:"generic", meetingUrl:"https://meet.google.com/abc-defg-hij"});
  await save._handler(ctx, {mode:"document", meetingUrl:""});
  assert.deepEqual(await get._handler(ctx, {}), {mode:"document", meetingUrl:null});
  subject = "made-up-account-b|made-up-session";
  assert.deepEqual(await get._handler(ctx, {}), {mode:"document", meetingUrl:null});
  assert.equal(rows.size, 2);
});
