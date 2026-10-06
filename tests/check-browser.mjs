// Rendering simulation by default. --live makes TWO real, paid model requests.
// Run --live only after explicit testing approval and Convex provider setup.
import { chromium } from "playwright-core";
import assert from "node:assert/strict";
import {mkdir} from "node:fs/promises";
const live = process.argv.includes("--live");
const browser = await chromium.launch({executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:true});
try {
  const page = await browser.newPage({viewport:{width:1440,height:1000}});
  const errors = [];
  page.on("pageerror",error=>errors.push(error.message));
  if (!live) await page.route("**/api/action", async route => {
    const question = route.request().postDataJSON().args[0].question;
    const supported = question.includes("Pro plan");
    await route.fulfill({json:{status:"success",value:{
      status:supported ? "verified":"unverified",
      answer:supported ? "SAML SSO is available on Pro if you’ve connected a Salesforce org to Slack.":"Not verified in this source",
      excerpt:supported ? "Available on the Free and Pro subscriptions if you’ve connected a Salesforce org to Slack":null,
      section:supported ? "Who can use this feature?":null,
      sourceTitle:"Set up SAML single sign-on for Slack",
      sourceUrl:"https://slack.com/help/articles/203772216-SAML-single-sign-on",elapsedMs:1234,
    }}});
  });
  await page.goto(process.env.CUELO_TEST_URL ?? "http://127.0.0.1:5173/");
  await page.getByRole("heading",{name:"An answer you can check."}).waitFor();
  assert.equal(await page.getByRole("button",{name:"Check the source",exact:true}).isDisabled(),true);
  await page.getByRole("button",{name:"Do you support SSO on the Pro plan?",exact:true}).click();
  await page.getByRole("button",{name:"Check the source",exact:true}).click();
  await page.getByRole("heading",{name:"Exact supporting excerpt"}).waitFor({timeout:60000});
  const answer = await page.locator(".answer").innerText();
  assert.match(answer,/Salesforce/i); assert.match(answer,/\bif\b|\bonly\b|\brequires?\b/i);
  const excerpt = await page.locator("blockquote").innerText();
  assert.match(excerpt,/Pro.*if.*Salesforce/i);
  assert.match(await page.locator(".citation").innerText(),/Who can use this feature/);
  await mkdir("artifacts",{recursive:true});
  const label = live ? "live":"SIMULATED";
  console.log(`${label} supported answer:`,answer);
  console.log(`${label} timing:`,await page.locator(".timing").innerText());
  await page.screenshot({path:`artifacts/${label}-supported-desktop.png`,fullPage:true});
  await page.getByRole("button",{name:"Can you guarantee a custom integration by Friday?",exact:true}).click();
  assert.equal(await page.locator("blockquote").count(),0);
  await page.getByRole("button",{name:"Check the source",exact:true}).click();
  await page.getByText("Not verified in this source",{exact:true}).waitFor({timeout:60000});
  assert.equal(await page.locator("blockquote").count(),0);
  console.log(`${label} missing answer:`,await page.locator(".refusal").innerText());
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth),false);
  await page.screenshot({path:`artifacts/${label}-refusal-narrow.png`,fullPage:true});
  assert.deepEqual(errors,[]);
  console.log(`${label}: both display checks passed; no browser errors or narrow overflow.`);
} finally {await browser.close();}
