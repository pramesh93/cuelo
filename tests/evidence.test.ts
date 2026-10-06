import {test} from "node:test";
import assert from "node:assert/strict";
import {parseSource, checkResult, assertDestination, SOURCE_URL, REFUSAL} from "../convex/evidence";

const html = `<h1>Set up SAML single sign-on for Slack</h1><div class="article_body"><h2>Step 1: Configure your identity provider</h2><p>Set up a connection between your IDP and Slack.</p></div><div class="boxed roles"><p><strong>Who can use this feature?</strong></p><ul><li>Available on the Business+ and Enterprise subscriptions</li><li>Available on the Free and Pro subscriptions if you’ve connected a Salesforce org to Slack</li></ul></div>`;
const source = parseSource(html, SOURCE_URL);
test("ignores navigation titles and labels nested availability passages correctly without duplicates", () => {
  const page = parseSource(`<h1>Workspace administration</h1><h1 class="article_title">Set up SAML single sign-on for Slack</h1><div class="article_body"><h2>Other section</h2><p>Other content.</p><div class="boxed roles"><li>Available on Pro if you’ve connected a Salesforce org to Slack</li></div></div>`,SOURCE_URL);
  assert.equal(page.title,"Set up SAML single sign-on for Slack");
  assert.equal(page.passages.filter(p=>p.text.includes("Salesforce")).length,1);
  assert.equal(page.passages.find(p=>p.text.includes("Salesforce"))?.section,"Who can use this feature?");
});
test("extracts availability outside the main article and keeps the Salesforce condition", () => {
  const result = checkResult({status:"verified",answer:"SAML SSO is available on Pro if you’ve connected a Salesforce org to Slack.", passageIds:[2]}, source);
  assert.equal(result.status,"verified");
  assert.equal(result.excerpt,"Available on the Free and Pro subscriptions if you’ve connected a Salesforce org to Slack");
  assert.equal(result.section,"Who can use this feature?");
});
test("rejects a Pro SSO answer that drops the Salesforce condition", () => {
  assert.equal(checkResult({status:"verified",answer:"Yes, SSO is available on Pro.",passageIds:[2]},source).answer,REFUSAL);
  assert.equal(checkResult({status:"verified",answer:"Yes, it is supported.",passageIds:[2]},source,"Do you support SSO on the Pro plan?").answer,REFUSAL);
});
test("missing support returns the exact refusal without invented evidence", () => {
  assert.deepEqual(checkResult({status:"unverified",answer:"We guarantee an integration by Friday.",passageIds:[]},source),{status:"unverified",answer:REFUSAL,excerpt:null,section:null});
});
test("rejects invented passage IDs and answers longer than 40 words", () => {
  assert.equal(checkResult({status:"verified",answer:"Supported",passageIds:[999]},source).status,"unverified");
  assert.equal(checkResult({status:"verified",answer:"word ".repeat(41),passageIds:[0]},source).status,"unverified");
});
test("rejects unexpected destinations, unreadable and oversized articles", () => {
  assert.doesNotThrow(()=>assertDestination("https://slack.com/intl/en-in/help/articles/203772216-SAML-single-sign-on"));
  assert.doesNotThrow(()=>assertDestination("https://slack.com/intl/en-gb/help/articles/203772216-Set-up-SAML-single-sign-on-for-Slack"));
  for (const url of ["http://127.0.0.1/", "https://slack.com.evil.example/", "https://slack.com/help/other"]) assert.throws(()=>assertDestination(url));
  assert.throws(()=>parseSource("<h1>No article body</h1>",SOURCE_URL));
  assert.throws(()=>parseSource(`<h1>Large</h1><div class="article_body"><p>${"x".repeat(24001)}</p></div>`,SOURCE_URL));
});
