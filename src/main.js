import './style.css';
import {createManifest,verifyManifest,artifactHash,SAMPLE} from './proof.mjs';
import {localConnection,monadConnection,readOnlyMonadConnection,deployMonad,transact,register,publishedId,verifyChainAnchor,STATUS} from './chain.mjs';
import {validateAnchor} from './anchor.mjs';
import {isAddress} from 'viem';

document.querySelector('#app').innerHTML=`
<header><a class="brand" href="./">Agent<span>Proof</span><i aria-hidden="true">✓</i></a><span class="event">Metropolis 2026 · Monad Testnet prototype</span><div class="network" id="network">Offline</div></header>
<main>
  <section class="intro"><div><h1>Give every agent delivery<br>a verifiable receipt.</h1><p>Track who delivered it, detect changed work, and record the reviewer’s decision.</p></div><div class="boundary"><b>Provenance, integrity, accountability.</b><p>A matching hash proves an unchanged artifact. Its accuracy still needs a reviewer.</p></div></section>
  <section class="connection" aria-label="Network connection"><div class="switch"><button id="artifact">Artifact checks</button><button id="local">Local EVM demo</button><button id="monad">Monad Testnet</button></div><span id="connectionText"></span><button id="connect">Connect local demo</button></section>
  <section id="monadSettings" class="settings" hidden><p>Verify an existing registry without a wallet. Publishing and review require two separate test wallets; each write opens your wallet for approval and uses test MON for gas.</p><div class="settingsRow"><label>Registry address<input id="address" placeholder="0x… (or deploy below)"></label><label>Designated reviewer wallet<input id="reviewer" placeholder="0x…"></label><button id="readonly">Connect read-only</button><button id="deploy">Deploy registry with wallet</button></div><p>No private keys are requested. Wallet addresses, artifact hashes and transactions become public on Testnet.</p></section>
  <div id="notice" role="status" aria-live="polite">Start with a synthetic brief. No customer files or external AI service are used.</div>
  <section class="workbench">
    <div class="document"><div class="sectionTop"><h2>Source & delivery</h2><span>Step 1</span></div><label for="source">Source brief (local, synthetic sample)</label><textarea id="source" spellcheck="false"></textarea><div class="runRow"><button id="run" class="primary">Run checking agent</button><span>Deterministic checklist agent v1</span></div><div id="checks" class="checks"><p>Run the agent to extract explicit requirements and flag missing fields.</p></div><details><summary>Checking policy</summary><p id="policyText">Detect an explicit date, timezone, demo, code link and write-up. Return exact matched source text and mark missing items. Presence checks do not prove eligibility or assess the meaning of a clause.</p></details></div>
    <div class="receipt"><div class="sectionTop"><h2>Delivery receipt</h2><span>Step 2</span></div><div class="receiptState" id="receiptState">Awaiting a delivery</div><p class="caption" id="receiptCaption">The source, output and checking policy each get a salted commitment.</p><dl id="hashes"></dl><button id="publish" class="primary" disabled>Publish receipt</button><details id="chainDetails"><summary>Chain evidence</summary><dl id="chainEvidence"></dl></details><div class="reviewRow"><button id="accept" disabled>Accept as reviewer</button><button id="reject" disabled>Reject as reviewer</button><button id="revoke" disabled>Revoke as publisher</button></div><p class="caption" id="reviewHint">Only the designated reviewer can accept or reject. A publisher can revoke.</p></div>
  </section>
  <section class="verification"><div class="sectionTop"><div><h2>Verify the delivery</h2><p>Recompute commitments here, then compare them with the live contract.</p></div><span>Step 3</span></div><label for="output">Delivery artifact (editable for the tamper test)</label><textarea id="output" spellcheck="false" placeholder="Run the agent to create a delivery."></textarea><div class="verifyRow"><button id="verify" class="primary" disabled>Verify against receipt</button><button id="tamper" disabled>Try a tampered delivery</button><button id="restore" disabled>Restore original</button><button id="export" disabled>Export proof package</button><label class="import">Import proof package<input type="file" id="import" accept=".json,application/json"></label></div><div id="verificationResult" role="status" aria-live="polite">No delivery to verify yet.</div></section>
  <details id="packageDetails" hidden><summary>Exported proof package · copy backup</summary><label for="packageText">Proof package JSON (includes source and output)</label><textarea id="packageText" readonly spellcheck="false"></textarea><p class="caption">Save this JSON locally. Anyone you share it with can read the included source, output and salt.</p></details>
  <details id="deploymentDetails" hidden><summary>Confirmed Testnet deployment · copy backup</summary><label for="deploymentText">Deployment evidence JSON (public contract coordinates)</label><textarea id="deploymentText" readonly spellcheck="false"></textarea></details>
  <footer><span>AgentProof / New build started 9 October 2026</span><span>Local mode is a real EVM sandbox. Monad integration requires a confirmed Testnet transaction.</span></footer>
</main>`;
const $=id=>document.getElementById(id);
const short=s=>s?s.slice(0,10)+'…'+s.slice(-6):'—';
const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isLoopback=['127.0.0.1','localhost','[::1]'].includes(location.hostname);
let mode=isLoopback?'local':'artifact',connection=null,manifest=null,anchor=null,busy=false,revision=0;
$('source').value=SAMPLE;
function notify(message,error=false){$('notice').textContent=message;$('notice').className=error?'error':'';}
function download(name,value){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);}
function receiptConnectionMatches(){return !!anchor&&!!connection&&connection.chainId===anchor.chainId&&connection.address?.toLowerCase()===anchor.address.toLowerCase();}
function downgradeAnchor(){if(anchor){anchor=validateAnchor(anchor);showAnchor();}}
function requireReceiptConnection(){if(!receiptConnectionMatches())throw new Error('Connect to this receipt’s network and registry before reviewing or revoking.');}
function controls(){
  const has=!!manifest, anchored=!!anchor,canWrite=!!connection&&(connection.mode==='local'||!!connection.owner&&typeof connection.signer==='function');
  $('run').disabled=busy; $('connect').disabled=busy;$('deploy').disabled=busy||mode!=='monad'||!canWrite;$('readonly').disabled=busy||mode!=='monad';
  $('source').disabled=$('output').disabled=busy;
  $('address').disabled=$('reviewer').disabled=busy;
  $('publish').disabled=busy||!has||!canWrite||anchored||$('source').value!==manifest.input;
  for(const id of ['verify','tamper','restore','export'])$(id).disabled=busy||!has;
  $('accept').disabled=$('reject').disabled=busy||!canWrite||!receiptConnectionMatches()||!anchor?.verified||anchor.status!==1;
  $('revoke').disabled=busy||!canWrite||!receiptConnectionMatches()||!anchor?.verified||anchor.status===4;
  for(const id of ['artifact','local','monad','import'])$(id).disabled=busy;
  $('local').disabled=busy||!isLoopback;
}
async function action(task){if(busy)return;busy=true;controls();try{await task();}catch(e){notify(e.shortMessage||e.message,true);invalidate('Action failed. Resolve the notice above, then verify again.');}finally{busy=false;controls();}}
function showHashes(){$('hashes').innerHTML=['input','output','policy'].map(k=>`<dt>${k[0].toUpperCase()+k.slice(1)} commitment</dt><dd title="${safe(manifest.commitments[k])}">${safe(manifest.commitments[k])}</dd>`).join('');}
function showAnchor(){
  if(!anchor)return;
  if(!anchor.verified){
    $('receiptState').textContent='Imported / unverified';$('receiptState').className='receiptState';
    $('receiptCaption').textContent='File hints are untrusted. Connect and verify the implementation, publication transaction and live receipt.';
    $('chainEvidence').innerHTML=Object.entries({Network:anchor.chainId,Registry:anchor.address,Receipt:anchor.receiptId,'Claimed publish transaction':anchor.publishTx}).map(([k,v])=>`<dt>${safe(k)}</dt><dd>${safe(v)}</dd>`).join('');return;
  }
  $('receiptState').textContent=STATUS[anchor.status];$('receiptState').className='receiptState state'+anchor.status;
  $('receiptCaption').textContent=`Confirmed on ${anchor.chainId===31337?'local EVM (not Monad)':'Monad Testnet'}. ${anchor.status===4?'Revoked receipts are invalid.':'Commitments are immutable.'}`;
  $('chainEvidence').innerHTML=Object.entries({Network:anchor.chainId,Registry:anchor.address,Receipt:anchor.receiptId,Agent:anchor.agentId,Publisher:anchor.owner,Reviewer:anchor.reviewer,'Publish transaction':anchor.publishTx,'Publish block':anchor.blockNumber,'Review deadline':new Date(Number(anchor.expiresAt)*1000).toISOString(),'Review evidence hash':anchor.reviewEvidenceHash}).map(([k,v])=>`<dt>${safe(k)}</dt><dd>${safe(v)}</dd>`).join('');
  if(anchor.chainId===10143){const link=document.createElement('a');link.href=`https://testnet.monadvision.com/tx/${anchor.publishTx}`;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Open confirmed publish transaction';$('chainEvidence').append(link);}
}
async function refresh(){
  anchor=await verifyChainAnchor(connection,manifest,anchor);showAnchor();return anchor;
}
function invalidate(message){revision++;$('verificationResult').textContent=message;$('verificationResult').className='';}
function newDelivery(m){
  $('packageDetails').hidden=true;
  manifest=m;anchor=null;$('source').value=m.input;$('output').value=m.output;$('policyText').textContent=m.policy;showHashes();
  let report;try{report=JSON.parse(m.output);}catch{}
  const checklist=report?.agent==='Checklist agent v1 (deterministic, no LLM)'&&Array.isArray(report.checks)&&report.checks.length<=50&&report.checks.every(c=>c&&typeof c.label==='string'&&['found','missing'].includes(c.status)&&(c.evidence===null||typeof c.evidence==='string'));
  $('checks').innerHTML=checklist?report.checks.map(c=>`<div class="check"><span class="${c.status==='found'?'found':'missing'}">${c.status==='found'?'✓':'?'}</span><b>${safe(c.label)}</b><small>${c.evidence?safe(c.evidence):'Missing from the brief'}</small></div>`).join(''):'<p>Imported agent output is shown below. Its checking policy is included in this package.</p>';
  $('receiptState').textContent='Ready to publish';$('receiptState').className='receiptState';$('receiptCaption').textContent='Commitments computed locally. Nothing has been published.';$('chainEvidence').innerHTML='';invalidate('Commitments ready. Verify before publishing.');
}
function switchMode(next,initial=false){
  if(next==='local'&&!isLoopback){notify('The local chain is available only from localhost. Follow the repository README to run it on your computer.');return;}
  mode=next;connection=null;if(anchor)anchor=validateAnchor(anchor);
  $('monadSettings').hidden=next!=='monad';
  for(const id of ['artifact','local','monad'])$(id).classList.toggle('selected',next===id);
  $('connect').hidden=next==='artifact';$('connect').textContent=next==='local'?'Connect local demo':'Connect Testnet wallet';
  $('network').textContent=next==='artifact'?'Artifact checks / no chain':next==='local'?'Local EVM / disconnected':'Monad Testnet / disconnected';
  $('connectionText').textContent=next==='artifact'?'Run, verify and export without a wallet. Local EVM requires the localhost app.':next==='local'?'Start npm run demo, then connect.':'Use a registry address for read-only verification, or connect a test wallet.';
  if(anchor)showAnchor();if(!initial){invalidate('Connection changed. Receipt coordinates are retained; connect to their network and verify again.');notify('Run a new delivery if you want to publish a fresh receipt on this network.');}controls();
}
$('artifact').onclick=()=>switchMode('artifact');
$('local').onclick=()=>switchMode('local');$('monad').onclick=()=>switchMode('monad');
$('connect').onclick=()=>action(async()=>{
  connection=mode==='local'?await localConnection():await monadConnection($('address').value.trim());
  if(anchor&&!receiptConnectionMatches())downgradeAnchor();
  $('network').textContent=mode==='local'?'Local EVM / 31337':'Monad Testnet / 10143';$('connectionText').textContent=`Publisher ${short(connection.owner)} · Registry ${short(connection.address)}`;
  if(mode==='local')$('reviewer').value=connection.reviewer;
  notify(mode==='local'?'Connected to the disposable local EVM. These are sandbox accounts.':'Connected to Monad Testnet. Each external write requires your wallet approval.');
});
$('readonly').onclick=()=>action(async()=>{
  connection=await readOnlyMonadConnection($('address').value.trim());
  $('network').textContent='Monad Testnet / read-only';$('connectionText').textContent=`Registry ${short(connection.address)} · wallet-free verification`;
  notify('Read-only Monad connection. Verification needs no wallet; publishing and review remain disabled.');
});
$('address').oninput=()=>{connection=null;downgradeAnchor();$('network').textContent='Monad Testnet / disconnected';$('connectionText').textContent='Registry address changed. Connect again to verify this registry.';invalidate('Registry address changed. Connect again before verification or any write.');controls();};
$('deploy').onclick=()=>action(async()=>{notify('Approve registry deployment in your wallet. Waiting for two confirmations…');const deployment=await deployMonad(connection);$('address').value=deployment.address;downgradeAnchor();invalidate('New registry deployed. Existing receipt coordinates still refer to their original registry.');$('connectionText').textContent=`Publisher ${short(connection.owner)} · Registry ${short(connection.address)}`;$('deploymentText').value=JSON.stringify(deployment,null,2);$('deploymentDetails').hidden=false;$('deploymentDetails').open=true;download('agentproof-monad-deployment.json',deployment);notify('Registry deployment confirmed on Monad Testnet. Evidence prepared for download and shown below as a copyable backup.');});
$('run').onclick=()=>{if(busy)return;try{newDelivery(createManifest($('source').value));notify('Agent delivery created. Missing fields stay visible; no facts were invented.');controls();}catch(e){notify(e.message,true);}};
$('publish').onclick=()=>action(async()=>{
  if($('source').value!==manifest.input)throw new Error('Displayed source changed. Restore the source or run the agent again before publishing.');
  if(!verifyManifest(manifest,$('output').value).valid)throw new Error('Restore the original delivery before publishing');
  const reviewer=mode==='local'?connection.reviewer:$('reviewer').value.trim();
  if(!isAddress(reviewer)||reviewer.toLowerCase()===connection.owner.toLowerCase())throw new Error('Choose a valid reviewer wallet different from the publisher');
  if(!connection.agentId){notify('Registering this publisher’s agent. Approve the wallet transaction…');await register(connection);}
  const block=await connection.publicClient.getBlock();const expiresAt=block.timestamp+86400n;
  notify(mode==='local'?'Publishing to local EVM…':'Approve receipt publication in your wallet. Waiting for two confirmations…');
  const c=manifest.commitments;const receipt=await transact(connection,connection.owner,'publishReceipt',[connection.agentId,manifest.taskId,c.input,c.output,c.policy,reviewer,expiresAt]);
  anchor={chainId:connection.chainId,address:connection.address,agentId:connection.agentId,owner:connection.owner,reviewer,receiptId:publishedId(receipt),publishTx:receipt.transactionHash,blockNumber:receipt.blockNumber.toString(),status:1,expiresAt:expiresAt.toString()};
  await refresh();notify(`Receipt confirmed in block ${anchor.blockNumber} on ${mode==='local'?'local EVM':'Monad Testnet'}.`);
});
async function verify(){
  invalidate('Checking delivery and live receipt…');
  const startRevision=revision, output=$('output').value;
  const result=verifyManifest(manifest,output);
  if($('source').value!==manifest.input){result.valid=false;result.reason='Displayed source differs from this receipt. Restore the source or run a new delivery.';}
  let valid=result.valid, message=result.reason;
  if(anchor&&mode!=='artifact'){
    if(!connection||connection.chainId!==anchor.chainId||connection.address?.toLowerCase()!==anchor.address.toLowerCase())throw new Error('Connect to the proof package network and registry before chain verification');
    const r=await refresh();
    valid=valid&&r.status!==4;
    message=!result.valid?result.reason:r.status===4?'Integrity matches, but publisher revoked this receipt':`Integrity verified against live contract. Review: ${STATUS[r.status]}.`;
    if(Number(r.status)===1&&Number(r.expiresAt)<Date.now()/1000)message+=' Review window expired.';
  }else message+=anchor?' · Chain status unverified (artifact checks only)':' · Not anchored on a chain';
  if(startRevision!==revision||output!==$('output').value){invalidate('Content changed during verification. Verify again.');return false;}
  $('verificationResult').textContent=message;$('verificationResult').className=valid?'valid':'invalid';
  return valid;
}
$('verify').onclick=()=>action(verify);
$('output').oninput=()=>invalidate('Delivery changed. Verify again.');
$('source').oninput=()=>{invalidate('Source edited. Run the agent to create a new delivery; the current receipt still refers to the previous source.');controls();};
$('tamper').onclick=()=>{$('output').value=manifest.output+'\nChanged after delivery.';invalidate('Artifact changed. Verify to test the commitment.');};
$('restore').onclick=()=>{$('output').value=manifest.output;invalidate('Original delivery restored. Verify again.');};
async function review(accepted){
  requireReceiptConnection();await refresh();
  if(accepted&&!(await verify()))throw new Error('Review requires a valid unchanged delivery');
  notify('Recording designated-reviewer decision. Use the reviewer wallet in Monad mode…');
  const evidence=artifactHash(JSON.stringify({receiptId:anchor.receiptId,accepted,output:manifest.commitments.output}),manifest.salt,'review');
  await transact(connection,anchor.reviewer,'reviewReceipt',[anchor.receiptId,accepted,evidence]);await refresh();invalidate('Review state changed. Verify the delivery again.');notify('Reviewer decision confirmed. Integrity and reviewer opinion remain separate.');
}
$('accept').onclick=()=>action(()=>review(true));$('reject').onclick=()=>action(()=>review(false));
$('revoke').onclick=()=>action(async()=>{requireReceiptConnection();await refresh();await transact(connection,anchor.owner,'revokeReceipt',[anchor.receiptId]);await refresh();invalidate('Receipt revoked. Verify again to inspect its invalid state.');notify('Publisher revocation confirmed. The original hashes remain on chain.');});
$('export').onclick=()=>{const p={manifest,anchor};$('packageText').value=JSON.stringify(p,null,2);$('packageDetails').hidden=false;$('packageDetails').open=true;download('agentproof-package.json',p);notify('Proof package prepared for download and shown below as a copyable backup. It includes the source and output.');};
$('import').onchange=()=>action(async()=>{try{const file=$('import').files[0];if(!file)return;if(file.size>1000000)throw new Error('Proof package must be under 1 MB');const p=JSON.parse(await file.text());const check=verifyManifest(p.manifest,p.manifest?.output);if(!check.valid)throw new Error(check.reason);const imported=p.anchor?validateAnchor(p.anchor):null;if(imported?.chainId===10143){switchMode('monad');$('address').value=imported.address;}else if(imported?.chainId===31337&&isLoopback&&mode!=='local')switchMode('local');newDelivery(p.manifest);anchor=imported;if(anchor)showAnchor();notify(anchor?'Proof package imported. Connect to its registry and verify against the live chain.':'Proof package imported. Verify its artifacts; it has no chain anchor.');}finally{$('import').value='';}});
switchMode(mode,true);
