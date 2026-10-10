// Actual React/SourceManager in Chrome; simulated source queries, no login/provider calls.
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
try{
 const page=await browser.newPage();
 await page.route('**/src/SourceManager.tsx',async route=>{
  const response=await route.fetch();let body=await response.text();
  const pattern=/import\s*\{[^}]+\}\s*from\s*["'][^"']*convex_react[^"']*["'];?/;
  assert.match(body,pattern);
  body=body.replace(pattern,'const {useAction,useMutation,useQuery,useConvexAuth}=window.__sourceHooks;');
  await route.fulfill({response,body,contentType:'text/javascript'});
 });
 await page.goto('http://127.0.0.1:5173/');
 await page.evaluate(async()=>{
  const React=await import('/node_modules/.vite/deps/react.js');const {createRoot}=await import('/node_modules/.vite/deps/react-dom_client.js');
  window.__testSource={id:'made-up-source',title:'Example source',kind:'text',url:null,pageCount:null,passageCount:1,saved:false,expiresAt:null};
  const noop=async()=>{};
  window.__sourceHooks={useAction:()=>noop,useMutation:()=>noop,useConvexAuth:()=>({isAuthenticated:false}),useQuery:(_fn,args)=>args==='skip'?undefined:window.__testSource};
  const {SourceManager}=await import('/src/SourceManager.tsx');
  const mount=document.createElement('div');document.body.replaceChildren(mount);
  function Harness(){const [confirmed,setConfirmed]=React.useState(null);const [tick,setTick]=React.useState(0);return React.createElement('div',{},React.createElement(SourceManager,{onSourceChanged:()=>setConfirmed(null),onConfirmed:source=>setConfirmed(source)}),React.createElement('button',{disabled:!confirmed},'Prepare call'),React.createElement('button',{onClick:()=>setTick(tick+1)},'Refresh screen'),React.createElement('button',{onClick:()=>{window.__testSource={...window.__testSource,id:'made-up-replacement'};setTick(tick+1);}},'Replace test source'));}
  createRoot(mount).render(React.createElement(Harness));
 });
 const prepare=page.getByRole('button',{name:'Prepare call',exact:true});
 await page.getByRole('button',{name:'Use this source',exact:true}).click();
 await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent==='Prepare call'&&!b.disabled));
 await page.getByRole('button',{name:'Refresh screen',exact:true}).click();
 assert.equal(await prepare.isEnabled(),true,'parent update must preserve explicit confirmation');
 await page.getByRole('button',{name:'Replace test source',exact:true}).click();
 await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent==='Prepare call'&&b.disabled));
 console.log('Source confirmation survives screen updates and clears on actual replacement (simulated source queries).');
}finally{await browser.close();}
