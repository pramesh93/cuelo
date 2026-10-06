// Real development Convex calls, made-up source files, no AI providers.
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {zipSync,strToU8} from 'fflate';
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
try{
const page=await browser.newPage({viewport:{width:1280,height:900}});const errors=[];let providerRequests=0;
page.on('pageerror',e=>errors.push(e.message));await page.route(/deepgram\.com|api\.openai\.com/,async r=>{providerRequests++;await r.abort();});
await page.goto(new URL('/?view=sources',process.env.CUELO_TEST_URL??'http://127.0.0.1:5173').href);
await page.getByLabel('Source name',{exact:true}).fill('Example product FAQ');await page.getByLabel('Source text',{exact:true}).fill('Made-up product uses password sign-in.\n\nMade-up product supports example access.');
await page.getByRole('button',{name:'Read source',exact:true}).click();await page.getByRole('heading',{name:'Example product FAQ',exact:true}).waitFor();
await page.getByRole('button',{name:'Inspect readable text',exact:true}).click();await page.getByText('Made-up product uses password sign-in.',{exact:true}).waitFor();
await page.getByRole('button',{name:'Replace source',exact:true}).click();await page.getByRole('radio',{name:'Upload file',exact:true}).check();
const doc=zipSync({'word/document.xml':strToU8('<w:document xmlns:w="urn:w"><w:body><w:p><w:r><w:t>Made-up Word source content.</w:t></w:r></w:p></w:body></w:document>'),'docProps/app.xml':strToU8('<Properties><Pages>1</Pages></Properties>')});
await page.getByLabel('PDF or Word document',{exact:true}).setInputFiles({name:'example.docx',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',buffer:Buffer.from(doc)});
await page.getByRole('button',{name:'Replace source',exact:true}).last().click();await page.getByRole('heading',{name:'example.docx',exact:true}).waitFor();
await page.getByRole('button',{name:'Inspect readable text',exact:true}).click();await page.getByText('Made-up Word source content.',{exact:true}).waitFor();
await page.screenshot({path:'/tmp/cuelo-source-desktop.png',fullPage:true});await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));assert.equal(await page.getByRole('heading',{name:'Answers start with your source.',exact:true}).count(),1);await page.screenshot({path:'/tmp/cuelo-source-narrow.png',fullPage:true});
await page.getByRole('button',{name:'Replace source',exact:true}).click();await page.getByRole('radio',{name:'Public webpage',exact:true}).check();await page.getByLabel('Public webpage link',{exact:true}).fill('https://127.0.0.1/');await page.getByRole('button',{name:'Replace source',exact:true}).last().click();await page.getByRole('alert').waitFor();assert.match(await page.getByRole('alert').innerText(),/public https/);await page.getByRole('heading',{name:'example.docx',exact:true}).waitFor();
await page.getByRole('button',{name:'Cancel replacement',exact:true}).click();await page.getByRole('button',{name:'Delete source',exact:true}).click();await page.getByText('Source deleted, including its readable text and search entries.',{exact:true}).waitFor();
assert.deepEqual(errors,[]);assert.equal(providerRequests,0);console.log(`Real ${process.env.CUELO_TEST_URL?'production':'development'} source flow passed: paste, inspect, Word upload, replacement, private-link rejection preserving source, deletion and narrow layout. Google-account saving remains untested in Chrome.`);
}finally{await browser.close();}
