import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {JSDOM} from 'jsdom';
import {createManifest,artifactHash} from '../src/proof.mjs';
import {JOURNAL_KEY} from '../src/transactions.mjs';

// Exercise the actual UI against explicit transaction-boundary spies.
// These unit tests do not claim a browser, wallet or Monad transaction occurred.
const main=await readFile(new URL('../src/main.js',import.meta.url),'utf8');
const compiled=await build({stdin:{contents:main,resolveDir:new URL('../src/',import.meta.url).pathname,sourcefile:'main.js'},bundle:true,format:'esm',platform:'node',write:false,loader:{'.css':'empty'},plugins:[{name:'ui-chain-boundary',setup(b){b.onResolve({filter:/^\.\/chain\.mjs$/},()=>({path:'boundary',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:`export const STATUS=['Missing','Pending review','Accepted','Rejected','Revoked']; ${['localConnection','monadConnection','readOnlyMonadConnection','deployMonad','transact','register','publishedId','verifyChainAnchor','recoveryConnection','recoverChainTransaction'].map(n=>`export const ${n}=(...args)=>globalThis.__uiChain.${n}(...args);`).join('\n')}`}));}}]});
const bundle=compiled.outputFiles[0].text;
const bundleDir=await mkdtemp(join(tmpdir(),'agentproof-ui-test-'));
const bundlePath=join(bundleDir,'ui.mjs');await writeFile(bundlePath,bundle);
after(()=>rm(bundleDir,{recursive:true,force:true}));
async function ui(t,url='http://127.0.0.1:5187/',options={}){
  const dom=new JSDOM('<div id="app"></div>',{url});
  Object.defineProperty(dom.window.navigator,'locks',{value:{request:async(name,callback)=>callback()}});
  const prior={window:globalThis.window,document:globalThis.document,location:globalThis.location,fetch:globalThis.fetch};
  globalThis.window=dom.window;globalThis.document=dom.window.document;globalThis.location=dom.window.location;
  if(options.pending)dom.window.localStorage.setItem(JOURNAL_KEY,JSON.stringify(options.pending));
  if(options.fetch)globalThis.fetch=options.fetch;
  let writes=0,readonlyConnections=0;
  const conn={mode:'local',chainId:31337,address:'0x'+'11'.repeat(20),owner:'0x'+'22'.repeat(20),reviewer:'0x'+'33'.repeat(20),agentId:'0x'+'44'.repeat(32),publicClient:{getBlock:async()=>({timestamp:5000n})}};
  globalThis.__uiChain={localConnection:async()=>conn,readOnlyMonadConnection:async address=>{readonlyConnections++;return {...conn,mode:'monad',chainId:10143,address,owner:null,signer:null};},monadConnection:async()=>{throw new Error('No test wallet');},transact:async()=>{writes++;return {transactionHash:'0x'+'55'.repeat(32),blockNumber:3n};},register:async()=>{},publishedId:()=> '0x'+'66'.repeat(32),verifyChainAnchor:async(c,m,a)=>({...a,verified:true,status:1,owner:conn.owner,reviewer:conn.reviewer,expiresAt:'9999999999',reviewEvidenceHash:'0x'+'00'.repeat(32)})};
  await import(pathToFileURL(bundlePath).href+'?instance='+crypto.randomUUID());
  t.after(()=>{dom.window.close();globalThis.window=prior.window;globalThis.document=prior.document;globalThis.location=prior.location;globalThis.fetch=prior.fetch;delete globalThis.__uiChain;});
  return {get:id=>dom.window.document.getElementById(id),dom,writes:()=>writes,readonlyConnections:()=>readonlyConnections};
}
test('public prototype never requests local-device access and runs artifact checks without a connection',async t=>{
  const app=await ui(t,'https://jokerfufu.github.io/agentproof-monad/');
  assert.equal(app.get('local').disabled,true);
  assert.equal(app.get('connect').hidden,true);
  assert.match(app.get('connectionText').textContent,/no wallet|without.*wallet/i);
  app.get('run').click();await app.get('verify').onclick();
  assert.match(app.get('verificationResult').textContent,/match.*Not anchored/i);
  assert.equal(app.writes(),0);
});
test('editing displayed source prevents publication of the previous source',async t=>{
  const app=await ui(t);app.get('local').click();await app.get('connect').onclick();app.get('run').click();
  app.get('source').value+='\nChanged source after generation.';
  app.get('source').dispatchEvent(new app.dom.window.Event('input',{bubbles:true}));
  await app.get('publish').onclick();
  assert.equal(app.writes(),0);
  assert.match(app.get('notice').textContent,/source.*(?:run|restore)|(?:run|restore).*source/i);
});
test('valid committed arbitrary agent output imports without a partial-render crash',async t=>{
  const app=await ui(t);const manifest=createManifest('A demo is required.');
  manifest.output=JSON.stringify({agent:'Checklist agent v1 (deterministic, no LLM)',checks:[null]});
  manifest.commitments.output=artifactHash(manifest.output,manifest.salt,'output');
  const json=JSON.stringify({manifest,anchor:null});
  Object.defineProperty(app.get('import'),'files',{configurable:true,value:[{size:json.length,text:async()=>json}]});
  await app.get('import').onchange();
  assert.match(app.get('notice').textContent,/imported/i);
  assert.match(app.get('checks').textContent,/Imported agent output/i);
  await app.get('verify').onclick();assert.match(app.get('verificationResult').textContent,/match/i);
});
test('an imported Monad receipt retains lookup coordinates and can use a wallet-free verification connection',async t=>{
  const app=await ui(t,'https://jokerfufu.github.io/agentproof-monad/');
  const manifest=createManifest('A demo is required.');
  const anchor={chainId:10143,address:'0x'+'77'.repeat(20),receiptId:'0x'+'88'.repeat(32),publishTx:'0x'+'99'.repeat(32)};
  const json=JSON.stringify({manifest,anchor});
  Object.defineProperty(app.get('import'),'files',{configurable:true,value:[{size:json.length,text:async()=>json}]});
  await app.get('import').onchange();
  assert.equal(app.get('address').value,anchor.address);
  assert.match(app.get('receiptState').textContent,/unverified/i);
  await app.get('readonly').onclick();await app.get('verify').onclick();
  assert.equal(app.readonlyConnections(),1);assert.equal(app.writes(),0);
  assert.match(app.get('verificationResult').textContent,/live contract/i);
  assert.equal(app.get('publish').disabled,true);assert.equal(app.get('accept').disabled,true);
  app.get('artifact').click();await app.get('verify').onclick();
  assert.match(app.get('verificationResult').textContent,/match.*Chain status unverified/i);
});
async function importMonad(app){
  const address='0x'+'77'.repeat(20),manifest=createManifest('A demo is required.');
  const json=JSON.stringify({manifest,anchor:{chainId:10143,address,receiptId:'0x'+'88'.repeat(32),publishTx:'0x'+'99'.repeat(32)}});
  Object.defineProperty(app.get('import'),'files',{configurable:true,value:[{size:json.length,text:async()=>json}]});
  await app.get('import').onchange();
  return address;
}
test('changing registry cannot send a retained receipt decision to another registry',async t=>{
  const app=await ui(t,'https://jokerfufu.github.io/agentproof-monad/');await importMonad(app);
  await app.get('readonly').onclick();await app.get('verify').onclick();
  const different='0x'+'ab'.repeat(20);
  app.get('address').value=different;app.get('address').dispatchEvent(new app.dom.window.Event('input'));
  assert.match(app.get('receiptState').textContent,/unverified/i);
  globalThis.__uiChain.monadConnection=async address=>({mode:'monad',chainId:10143,address,owner:'0x'+'22'.repeat(20),signer:()=>({})});
  await app.get('connect').onclick();
  assert.equal(app.get('reject').disabled,true);assert.equal(app.get('revoke').disabled,true);
  await app.get('reject').onclick();await app.get('revoke').onclick();
  assert.equal(app.writes(),0);assert.match(app.get('notice').textContent,/receipt.*(?:network|registry)/i);
});
test('deploying a new registry downgrades retained receipt evidence',async t=>{
  const app=await ui(t,'https://jokerfufu.github.io/agentproof-monad/');const address=await importMonad(app);
  globalThis.__uiChain.monadConnection=async()=>({mode:'monad',chainId:10143,address,owner:'0x'+'22'.repeat(20),signer:()=>({})});
  await app.get('connect').onclick();await app.get('verify').onclick();
  globalThis.__uiChain.deployMonad=async c=>{c.address='0x'+'ab'.repeat(20);return {address:c.address};};
  globalThis.URL.createObjectURL??=()=> 'blob:test';
  app.dom.window.HTMLAnchorElement.prototype.click=()=>{};
  await app.get('deploy').onclick();
  assert.match(app.get('receiptState').textContent,/unverified/i);
  assert.equal(app.get('reject').disabled,true);assert.equal(app.get('revoke').disabled,true);
  assert.equal(app.writes(),0);
});

test('a failed live RPC refresh removes previously verified identities and decision controls',async t=>{
  const app=await ui(t,'https://jokerfufu.github.io/agentproof-monad/');const address=await importMonad(app);
  globalThis.__uiChain.monadConnection=async()=>({mode:'monad',chainId:10143,address,owner:'0x'+'22'.repeat(20),signer:()=>({})});
  await app.get('connect').onclick();await app.get('verify').onclick();
  assert.equal(app.get('accept').disabled,false);
  globalThis.__uiChain.verifyChainAnchor=async()=>{throw new Error('RPC unavailable');};
  await app.get('verify').onclick();
  assert.equal(app.get('accept').disabled,true,'A failed query must withdraw a stale verified review action');
  assert.equal(app.get('revoke').disabled,true);
  assert.match(app.get('receiptState').textContent,/unverified|unavailable/i);
  assert.doesNotMatch(app.get('chainEvidence').textContent,/Review deadline/);
});

test('one click reloads the actual Monad example and verifies read-only instead of trusting file status',async t=>{
  const proof=JSON.parse(await readFile(new URL('../public/agentproof-monad-proof.json',import.meta.url),'utf8'));
  let fetches=0,live=0;
  const app=await ui(t,'https://jokerfufu.github.io/agentproof-monad/',{fetch:async url=>{fetches++;assert.match(String(url),/agentproof-monad-proof\.json$/);return new Response(JSON.stringify(proof));}});
  globalThis.__uiChain.verifyChainAnchor=async(c,m,a)=>{
    live++;assert.equal(c.signer,null);assert.equal(a.verified,false);assert.equal(a.status,undefined);
    return {...a,verified:true,status:3,owner:'0x'+'22'.repeat(20),reviewer:'0x'+'33'.repeat(20),expiresAt:'9999999999',blockNumber:'8'};
  };
  assert.ok(app.get('loadExample'),'A wallet-free example must have an explicit entrypoint');
  await app.get('loadExample').onclick();
  assert.equal(fetches,1);assert.equal(live,1);assert.equal(app.readonlyConnections(),1);assert.equal(app.writes(),0);
  assert.match(app.get('integrityState').textContent,/match/i);assert.match(app.get('reviewState').textContent,/Rejected/i);
  assert.equal(app.get('accept').disabled,true);
});
test('sample RPC failure retains artifact integrity and exposes an honest unknown decision',async t=>{
  const proof=JSON.parse(await readFile(new URL('../public/agentproof-monad-proof.json',import.meta.url),'utf8'));
  const app=await ui(t,'https://jokerfufu.github.io/agentproof-monad/',{fetch:async()=>new Response(JSON.stringify(proof))});
  globalThis.__uiChain.verifyChainAnchor=async()=>{throw new Error('RPC offline');};
  assert.ok(app.get('loadExample'));await app.get('loadExample').onclick();
  assert.match(app.get('integrityState').textContent,/match/i);
  assert.match(app.get('anchorState').textContent,/unavailable|unverified/i);
  assert.match(app.get('reviewState').textContent,/unknown|unverified/i);
  assert.doesNotMatch(app.get('reviewState').textContent,/Accepted/);
  assert.equal(app.get('export').disabled,false);assert.equal(app.writes(),0);
});
test('revocation is separate from an intact artifact and a reviewer decision',async t=>{
  const app=await ui(t,'https://jokerfufu.github.io/agentproof-monad/');await importMonad(app);await app.get('readonly').onclick();
  globalThis.__uiChain.verifyChainAnchor=async(c,m,a)=>({...a,verified:true,status:4,owner:'0x'+'22'.repeat(20),reviewer:'0x'+'33'.repeat(20),expiresAt:'9999999999',blockNumber:'8'});
  await app.get('verify').onclick();
  assert.ok(app.get('integrityState'));assert.match(app.get('integrityState').textContent,/match/i);
  assert.match(app.get('anchorState').textContent,/revoked/i);assert.match(app.get('reviewState').textContent,/revoked|unavailable/i);
  assert.equal(app.writes(),0);
});
test('version comparison exposes exact changed lines without interpreting output as HTML',async t=>{
  const app=await ui(t);app.get('run').click();
  app.get('output').value+='\n<img src=x onerror=alert(1)>';
  app.get('output').dispatchEvent(new app.dom.window.Event('input'));
  assert.ok(app.get('compare'));app.get('compare').click();
  assert.match(app.get('comparePanel').textContent,/<img src=x onerror=alert\(1\)>/);
  assert.equal(app.get('comparePanel').querySelector('img'),null);
  app.get('restore').click();await app.get('verify').onclick();
  assert.match(app.get('integrityState').textContent,/match/i);
});

const pendingPublication=taskId=>({version:'agentproof/transaction/1',kind:'publishReceipt',chainId:31337,hash:'0x'+'55'.repeat(32),state:'unknown',request:{from:'0x'+'22'.repeat(20),to:'0x'+'11'.repeat(20),data:'0x1234'},context:{taskId,receiptId:'0x'+'66'.repeat(32)},startedAt:'2026-10-12T00:00:00.000Z'});
test('unknown publication disables repeat sends and recovery only queries the saved transaction',async t=>{
  const app=await ui(t);app.get('local').click();await app.get('connect').onclick();app.get('run').click();
  let sends=0,recoveries=0;
  const taskId=JSON.parse((await readFile(new URL('../public/agentproof-monad-proof.json',import.meta.url),'utf8'))).manifest.taskId;
  const transaction=pendingPublication(taskId);
  globalThis.__uiChain.transact=async(c,actor,name,args,options)=>{
    sends++;transaction.context.taskId=args[1];options.onUpdate({...transaction,state:'broadcast'});
    const error=new Error('Transaction result unknown');error.transaction=transaction;throw error;
  };
  await app.get('publish').onclick();
  assert.equal(app.get('publish').disabled,true);assert.match(app.get('transactionText').textContent,/unknown/i);
  assert.equal(JSON.parse(app.dom.window.localStorage.getItem(JOURNAL_KEY)).hash,transaction.hash);
  await app.get('publish').onclick();assert.equal(sends,1);
  globalThis.__uiChain.recoveryConnection=async()=>({mode:'local',chainId:31337,address:transaction.request.to,owner:null,signer:null});
  globalThis.__uiChain.recoverChainTransaction=async(c,r)=>{recoveries++;assert.equal(r.hash,transaction.hash);assert.equal(c.signer,null);return {receipt:{status:'success',transactionHash:r.hash,blockNumber:9n},receiptId:transaction.context.receiptId};};
  await app.get('recover').onclick();
  assert.equal(sends,1);assert.equal(recoveries,1);assert.equal(app.dom.window.localStorage.getItem(JOURNAL_KEY),null);
  assert.equal(app.get('publish').disabled,true);
});
test('reloaded unknown transaction blocks every write entrypoint until read-only recovery',async t=>{
  const pending=pendingPublication('0x'+'44'.repeat(32));
  const app=await ui(t,'http://127.0.0.1:5187/',{pending});
  assert.ok(app.get('recover'));assert.equal(app.get('recover').disabled,false);
  app.get('local').click();await app.get('connect').onclick();app.get('run').click();
  for(const id of ['publish','deploy','accept','reject','revoke']){assert.equal(app.get(id).disabled,true);await app.get(id).onclick();}
  assert.equal(app.writes(),0);assert.equal(JSON.parse(app.dom.window.localStorage.getItem(JOURNAL_KEY)).hash,pending.hash);
});
test('empty input and malformed imports give actionable errors without losing the current delivery',async t=>{
  const app=await ui(t);app.get('source').value=' ';app.get('run').click();
  assert.match(app.get('notice').textContent,/input|source|brief/i);assert.equal(app.get('verify').disabled,true);
  app.get('source').value='Demo required.';app.get('run').click();const output=app.get('output').value;
  Object.defineProperty(app.get('import'),'files',{configurable:true,value:[{size:3,text:async()=>'{x'}]});
  await app.get('import').onchange();assert.equal(app.get('output').value,output);assert.match(app.get('notice').textContent,/JSON|package|invalid/i);
});

test('review and revocation broadcast failures withdraw prior live identity and decision evidence',async t=>{
  const app=await ui(t,'https://jokerfufu.github.io/agentproof-monad/');const address=await importMonad(app);
  globalThis.__uiChain.monadConnection=async()=>({mode:'monad',chainId:10143,address,owner:'0x'+'22'.repeat(20),signer:()=>({})});
  await app.get('connect').onclick();await app.get('verify').onclick();
  globalThis.__uiChain.transact=async(c,actor,name,args,options)=>{
    const transaction={version:'agentproof/transaction/1',kind:name,chainId:10143,hash:'0x'+'55'.repeat(32),state:'unknown',request:{from:actor,to:address,data:'0x1234'},context:{receiptId:args[0]},startedAt:new Date().toISOString()};
    options.onUpdate({...transaction,state:'broadcast'});const error=new Error('Transaction result unknown');error.transaction=transaction;throw error;
  };
  await app.get('accept').onclick();
  assert.match(app.get('integrityState').textContent,/match/i);assert.match(app.get('reviewState').textContent,/Unknown/);assert.match(app.get('receiptState').textContent,/unverified/);
  assert.doesNotMatch(app.get('chainEvidence').textContent,/Publisher|Reviewer/);assert.equal(app.get('revoke').disabled,true);
});
test('gas-estimation RPC failure after a fresh query cannot reactivate old review controls',async t=>{
  const app=await ui(t,'https://jokerfufu.github.io/agentproof-monad/');const address=await importMonad(app);
  globalThis.__uiChain.monadConnection=async()=>({mode:'monad',chainId:10143,address,owner:'0x'+'22'.repeat(20),signer:()=>({})});
  await app.get('connect').onclick();await app.get('verify').onclick();
  globalThis.__uiChain.transact=async()=>{throw new Error('RPC gas estimation unavailable');};
  await app.get('revoke').onclick();
  assert.equal(app.get('accept').disabled,true);assert.equal(app.get('revoke').disabled,true);assert.match(app.get('reviewState').textContent,/Unknown/);
  assert.match(app.get('integrityState').textContent,/match/i);
});
