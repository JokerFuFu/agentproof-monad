import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {JSDOM} from 'jsdom';
import {createManifest,artifactHash} from '../src/proof.mjs';

// Exercise the actual UI against explicit transaction-boundary spies.
// These unit tests do not claim a browser, wallet or Monad transaction occurred.
const main=await readFile(new URL('../src/main.js',import.meta.url),'utf8');
const compiled=await build({stdin:{contents:main,resolveDir:new URL('../src/',import.meta.url).pathname,sourcefile:'main.js'},bundle:true,format:'esm',platform:'node',write:false,loader:{'.css':'empty'},plugins:[{name:'ui-chain-boundary',setup(b){b.onResolve({filter:/^\.\/chain\.mjs$/},()=>({path:'boundary',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:`export const STATUS=['Missing','Pending review','Accepted','Rejected','Revoked']; ${['localConnection','monadConnection','readOnlyMonadConnection','deployMonad','transact','register','publishedId','verifyChainAnchor'].map(n=>`export const ${n}=(...args)=>globalThis.__uiChain.${n}(...args);`).join('\n')}`}));}}]});
const bundle=compiled.outputFiles[0].text;
const bundleDir=await mkdtemp(join(tmpdir(),'agentproof-ui-test-'));
const bundlePath=join(bundleDir,'ui.mjs');await writeFile(bundlePath,bundle);
after(()=>rm(bundleDir,{recursive:true,force:true}));
async function ui(t,url='http://127.0.0.1:5187/'){
  const dom=new JSDOM('<div id="app"></div>',{url});
  const prior={window:globalThis.window,document:globalThis.document,location:globalThis.location};
  globalThis.window=dom.window;globalThis.document=dom.window.document;globalThis.location=dom.window.location;
  let writes=0,readonlyConnections=0;
  const conn={mode:'local',chainId:31337,address:'0x'+'11'.repeat(20),owner:'0x'+'22'.repeat(20),reviewer:'0x'+'33'.repeat(20),agentId:'0x'+'44'.repeat(32),publicClient:{getBlock:async()=>({timestamp:5000n})}};
  globalThis.__uiChain={localConnection:async()=>conn,readOnlyMonadConnection:async address=>{readonlyConnections++;return {...conn,mode:'monad',chainId:10143,address,owner:null,signer:null};},monadConnection:async()=>{throw new Error('No test wallet');},transact:async()=>{writes++;return {transactionHash:'0x'+'55'.repeat(32),blockNumber:3n};},register:async()=>{},publishedId:()=> '0x'+'66'.repeat(32),verifyChainAnchor:async(c,m,a)=>({...a,verified:true,status:1,owner:conn.owner,reviewer:conn.reviewer,expiresAt:'9999999999',reviewEvidenceHash:'0x'+'00'.repeat(32)})};
  await import(pathToFileURL(bundlePath).href+'?instance='+crypto.randomUUID());
  t.after(()=>{dom.window.close();globalThis.window=prior.window;globalThis.document=prior.document;globalThis.location=prior.location;delete globalThis.__uiChain;});
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
  const app=await ui(t);await app.get('connect').onclick();app.get('run').click();
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
