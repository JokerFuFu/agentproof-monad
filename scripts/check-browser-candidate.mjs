// Local, isolated Chrome/CDP acceptance checks. No wallet or write RPC is used.
// Start Chrome with a temporary profile and --remote-debugging-port=9237 first.
import {writeFile,readFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';

const origin=process.env.AGENTPROOF_PREVIEW_URL||'http://127.0.0.1:5197/';
const out=resolve(process.env.AGENTPROOF_EVIDENCE_DIR||'../deliverables');
await mkdir(out,{recursive:true});
const target=await (await fetch('http://127.0.0.1:9237/json/new?about:blank',{method:'PUT'})).json();
const ws=new WebSocket(target.webSocketDebuggerUrl),pending=new Map();let sequence=0,loaded;
const report={checkedAt:new Date().toISOString(),browser:'Isolated headless Chrome via CDP',url:origin,steps:[],rpcMethods:[],runtimeErrors:[]};
ws.addEventListener('message',event=>{
  const message=JSON.parse(event.data);
  if(message.id){const work=pending.get(message.id);if(work){clearTimeout(work.timer);pending.delete(message.id);message.error?work.reject(new Error(message.error.message)):work.resolve(message.result);}}
  if(message.method==='Runtime.exceptionThrown')report.runtimeErrors.push(message.params.exceptionDetails.text);
  if(message.method==='Page.loadEventFired')loaded?.();
  if(message.method==='Network.requestWillBeSent'){
    const request=message.params.request;
    if(request.url.startsWith('https://testnet-rpc.monad.xyz')&&request.postData){try{const data=JSON.parse(request.postData);for(const item of Array.isArray(data)?data:[data])report.rpcMethods.push(item.method);}catch{}}
  }
});
await new Promise((accept,reject)=>{ws.addEventListener('open',accept,{once:true});ws.addEventListener('error',reject,{once:true});});
function send(method,params={}){
  const id=++sequence;
  return new Promise((accept,reject)=>{const timer=setTimeout(()=>{pending.delete(id);reject(new Error('CDP timeout: '+method));},45000);pending.set(id,{resolve:accept,reject,timer});ws.send(JSON.stringify({id,method,params}));});
}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}
async function waitFor(expression){for(let i=0;i<250;i++){if(await evaluate(expression))return;await new Promise(r=>setTimeout(r,100));}throw new Error('UI condition timed out: '+expression);}
const click=id=>evaluate(`document.getElementById(${JSON.stringify(id)}).onclick()`);
const text=id=>evaluate(`document.getElementById(${JSON.stringify(id)}).textContent`);
const fill=(id,value)=>evaluate(`(()=>{const e=document.getElementById(${JSON.stringify(id)});e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
function check(condition,message){if(!condition)throw new Error(message);}
async function states(){return evaluate(`({integrity:document.getElementById('integrityState').textContent,anchor:document.getElementById('anchorState').textContent,decision:document.getElementById('reviewState').textContent,writesDisabled:['publish','deploy','accept','reject','revoke'].every(id=>document.getElementById(id).disabled)})`);}
async function navigate(){
  const ready=new Promise((accept,reject)=>{const timer=setTimeout(()=>reject(new Error('Preview navigation did not finish')),25000);loaded=()=>{clearTimeout(timer);accept();};});
  const result=await send('Page.navigate',{url:origin});
  if(result.errorText)throw new Error('Preview navigation failed: '+result.errorText);
  await ready;loaded=null;await waitFor(`!!document.getElementById('loadExample')`);
}
async function resize(width,height=900){await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<600});}
async function screenshot(name){await evaluate('scrollTo(0,0)');const layout=await send('Page.getLayoutMetrics');const size=layout.cssContentSize;const result=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width:Math.ceil(size.width),height:Math.ceil(size.height),scale:1}});await writeFile(resolve(out,name),Buffer.from(result.data,'base64'));}
async function upload(path){const {root}=await send('DOM.getDocument');const {nodeId}=await send('DOM.querySelector',{nodeId:root.nodeId,selector:'#import'});await send('DOM.setFileInputFiles',{nodeId,files:[path]});await waitFor(`!document.getElementById('run').disabled`);}

try{
  await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await resize(1440,1080);await navigate();
  const source=await evaluate(`document.getElementById('source').value`);
  await fill('source',' ');await click('run');
  check(await evaluate(`document.getElementById('verify').disabled`),'Empty source enabled verification');
  report.steps.push({name:'Empty source',notice:await text('notice')});
  await fill('source',source);await click('run');const original=await evaluate(`document.getElementById('output').value`);
  const invalid='/tmp/agentproof-invalid-ui.json',large='/tmp/agentproof-oversized-ui.json';
  await writeFile(invalid,'{bad');await writeFile(large,Buffer.alloc(1000001,32));
  await upload(invalid);check((await text('notice')).includes('Invalid JSON'),'Malformed import error absent');
  check(await evaluate(`document.getElementById('output').value` )===original,'Malformed import destroyed work');
  report.steps.push({name:'Malformed import preserves work',notice:await text('notice')});
  await upload(large);check((await text('notice')).includes('1 MB'),'Oversized file accepted');
  report.steps.push({name:'Oversized import rejected',notice:await text('notice')});
  await fill('source',source+' Changed displayed source.');await click('verify');check((await states()).integrity==='Content mismatch','Source edit not detected');
  report.steps.push({name:'Source edit',state:await states(),summary:await text('checkSummary')});
  await click('restoreSource');await click('verify');check((await states()).integrity==='Matches commitments','Source restore failed');
  await click('tamper');await click('verify');check((await states()).integrity==='Content mismatch','Tamper not detected');
  report.steps.push({name:'Local tamper comparison',state:await states(),diff:await text('diffSummary')});
  for(const width of [320,390,768,1440]){await resize(width);const dimensions=await evaluate(`({page:document.documentElement.scrollWidth,viewport:innerWidth})`);check(dimensions.page===dimensions.viewport,'Page overflow at '+width);report.steps.push({name:'Comparison layout '+width,...dimensions});}
  await click('deliveryTab');await evaluate(`document.getElementById('deliveryTab').focus()`);
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});
  check(await evaluate(`document.activeElement.id==='compare'&&document.getElementById('compare').getAttribute('aria-selected')==='true'`),'Keyboard editor tab switch failed');
  report.steps.push({name:'Keyboard editor tab switch',passed:true});
  await click('loadExample');let live=await states();check(live.anchor==='Verified on Monad Testnet','Real Monad example verification failed');
  report.steps.push({name:'Fresh actual read-only Monad verification',state:live,evidence:await text('chainEvidence')});
  await click('tamper');await click('verify');check((await states()).integrity==='Content mismatch'&&(await states()).anchor.includes('Verified'),'Integrity and live anchor were conflated');
  report.steps.push({name:'Tampered delivery against actual chain',state:await states()});
  await click('restore');await click('verify');
  await send('Network.setBlockedURLs',{urls:['https://testnet-rpc.monad.xyz*']});await click('verify');
  const failed=await states();check(failed.integrity==='Matches commitments'&&failed.anchor.includes('Unavailable')&&failed.decision.includes('Unknown')&&failed.writesDisabled,'RPC failure retained trusted state');
  report.steps.push({name:'Simulated RPC block after live success',state:failed,notice:await text('notice')});
  await send('Network.setBlockedURLs',{urls:[]});await click('verify');check((await states()).anchor.includes('Verified'),'Real RPC retry failed');
  const proof=JSON.parse(await readFile(new URL('../public/agentproof-monad-proof.json',import.meta.url),'utf8'));
  const record=await evaluate(`(async()=>{const r=await fetch('https://testnet-rpc.monad.xyz',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_getTransactionByHash',params:[${JSON.stringify(proof.anchor.publishTx)}]})});const tx=(await r.json()).result;return {version:'agentproof/transaction/1',kind:'publishReceipt',chainId:10143,hash:tx.hash,state:'unknown',request:{from:tx.from,to:tx.to,data:tx.input,nonce:parseInt(tx.nonce,16)},context:{taskId:${JSON.stringify(proof.manifest.taskId)},receiptId:${JSON.stringify(proof.anchor.receiptId)}},scanFromBlock:parseInt(tx.blockNumber,16).toString(),startedAt:new Date().toISOString()};})()`);
  await evaluate(`localStorage.setItem('agentproof.pending-transaction.v1',${JSON.stringify(JSON.stringify(record))})`);await navigate();
  check((await text('transactionText')).includes('unknown')&&(await states()).writesDisabled,'Unknown journal lock did not survive reload');
  report.steps.push({name:'Seeded unknown journal after reload',disclosure:'Existing confirmed public example hash was seeded; no new broadcast.',hash:record.hash,text:await text('transactionText')});
  await click('loadExample');await click('recover');check(await evaluate(`localStorage.getItem('agentproof.pending-transaction.v1')===null`),'Recovery record not cleared');
  check((await states()).anchor.includes('Verified'),'Recovery did not restore fresh chain verification');
  report.steps.push({name:'Real RPC recovery of seeded existing transaction',state:await states(),notice:await text('notice')});
  const lockCheck=await evaluate(`(async()=>{const {TransactionJournal}=await import('/src/transactions.mjs');const a=new TransactionJournal(localStorage),b=new TransactionJournal(localStorage);let submissions=0;const task=journal=>journal.withWriteLock(async()=>{await Promise.resolve();submissions++;journal.record(${JSON.stringify(record)});throw new Error('Simulated unknown result');},navigator.locks);const results=await Promise.allSettled([task(a),task(b)]);a.resolve();return {submissions,rejected:results.filter(r=>r.status==='rejected').length};})()`);
  check(lockCheck.submissions===1&&lockCheck.rejected===2,'Native browser write coordination failed');
  report.steps.push({name:'Native browser Web Locks coordinate independent journals',disclosure:'Submission boundaries simulated in local storage; no signing or transaction broadcast.',...lockCheck});
  // A new navigation removes transient test-history UI before deliverable capture.
  await navigate();await click('loadExample');await resize(1440,1080);await screenshot('agentproof-desktop.png');
  await resize(390,844);await screenshot('agentproof-mobile.png');
  check(!report.rpcMethods.some(method=>/send|sign/i.test(method)),'Unexpected write RPC during browser acceptance');
  check(report.runtimeErrors.length===0,'Unhandled browser runtime errors');
  report.status='passed';
  await writeFile(resolve(out,'browser-candidate-checks.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({status:report.status,checks:report.steps.length,runtimeErrors:report.runtimeErrors.length,writeRpcMethods:0,files:['agentproof-desktop.png','agentproof-mobile.png','browser-candidate-checks.json']},null,2));
}catch(error){report.status='failed';report.error=error.message;await writeFile(resolve(out,'browser-candidate-checks.json'),JSON.stringify(report,null,2)+'\n');throw error;}
finally{ws.close();}
