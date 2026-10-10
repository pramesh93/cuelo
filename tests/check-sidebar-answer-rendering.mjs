// Unpaid UI check: first run tests/sidebar-answer-rendering.test.ts to render
// the real AnswerCard component with fictional, explicitly simulated results.
import {chromium} from 'playwright-core';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:420,height:900}});
 await page.route('**/*',route=>route.abort());
 await page.setContent(await readFile('artifacts/sidebar-evidence-check.html','utf8'));
 await page.getByText('Not from your document',{exact:true}).waitFor({state:'visible'});
 const passage=page.locator('blockquote');
 assert.equal(await passage.isVisible(),false);
 await page.getByText('Open supporting passage',{exact:true}).click();
 await passage.waitFor({state:'visible'});
 assert.equal(await passage.innerText(),'Business includes Salesforce integration.');
 console.log('SIMULATED answers in real Chrome: generic label visible; exact evidence opens on click. Network blocked; no provider requests.');
}finally{await browser.close();}
