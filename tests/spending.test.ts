import {test} from "node:test";
import assert from "node:assert/strict";
import {reserve, snapshot} from "../convex/spending";
import {MONTHLY_BUDGET_PAISE, budgetDecision} from "../convex/spendingPolicy";

test("monthly spending reserves before work, alerts at 80%, and keeps 10% headroom", () => {
  assert.equal(MONTHLY_BUDGET_PAISE, 500000);
  assert.equal(budgetDecision(0, 10000).allowed, true);
  assert.equal(budgetDecision(390000, 10000).alert, true);
  assert.equal(budgetDecision(440000, 10000).allowed, true);
  assert.equal(budgetDecision(440000, 10001).allowed, false);
  assert.equal(budgetDecision(500000, 1).allowed, false);
  for (const invalid of [0, -1, NaN, Infinity, 1.1, 500001]) {
    assert.throws(() => budgetDecision(0, invalid), /whole number/);
  }
});

test("disabled paid testing cannot reserve, idempotent retries do not charge twice, and all purposes share the cap", async () => {
  const previous = process.env.V1_PAID_TESTING_ENABLED;
  try {
    delete process.env.V1_PAID_TESTING_ENABLED;
    let monthly: Record<string, any> | null = null;
    const leases = new Map<string, Record<string, any>>();
    const ctx = {db:{
      query: (table:string) => ({withIndex: (_name:string, select:(q:{eq:(field:string,value:any)=>any})=>unknown) => {
        let key="";const q={eq:(_field:string,value:any)=>{key=value;return q;}};select(q);
        return {take:async()=>table==="spendingMonths" ? monthly ? [monthly] : [] : leases.has(key) ? [leases.get(key)] : []};
      }}),
      insert: async (table:string,row:Record<string,any>)=>{if(table==="spendingMonths") {monthly={_id:"month",...row};return "month";}
        leases.set(row.key,{_id:row.key,...row});return row.key;},
      patch: async (_id:unknown,values:Record<string,any>)=>{Object.assign(monthly!,values);},
    }} as unknown as Parameters<typeof reserve._handler>[0];
    assert.equal(reserve.isInternal, true);
    assert.equal(snapshot.isInternal, true);
    assert.equal((await reserve._handler(ctx,{key:"opening-attempt",purpose:"opening",amountPaise:10000})).status,"disabled");
    assert.equal(monthly,null);
    process.env.V1_PAID_TESTING_ENABLED="true";
    assert.equal((await reserve._handler(ctx,{key:"opening-attempt",purpose:"opening",amountPaise:10000})).status,"reserved");
    assert.equal((await reserve._handler(ctx,{key:"opening-attempt",purpose:"opening",amountPaise:10000})).status,"reserved");
    assert.equal(monthly!.reservedPaise,10000);
    await assert.rejects(()=>reserve._handler(ctx,{key:"opening-attempt",purpose:"live",amountPaise:10000}),/reservation/);
    assert.equal((await reserve._handler(ctx,{key:"avatar-attempt",purpose:"practice",amountPaise:20000})).status,"reserved");
    assert.equal((await reserve._handler(ctx,{key:"call-attempt",purpose:"live",amountPaise:420000})).status,"reserved");
    assert.equal(monthly!.reservedPaise,450000);
    assert.equal((await reserve._handler(ctx,{key:"one-more",purpose:"opening",amountPaise:1})).status,"exhausted");
    assert.equal(leases.size,3);
    const state=await snapshot._handler(ctx,{});
    assert.equal(state.alert,true);assert.equal(state.availablePaise,0);
  } finally {if(previous===undefined)delete process.env.V1_PAID_TESTING_ENABLED;else process.env.V1_PAID_TESTING_ENABLED=previous;}
});
