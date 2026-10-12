import './style.css';
import {workspaceView} from './view.mjs';
import {createManifest,verifyManifest,artifactHash,SAMPLE} from './proof.mjs';
import {localConnection,monadConnection,readOnlyMonadConnection,deployMonad,transact,register,publishedId,verifyChainAnchor,STATUS,recoveryConnection,recoverChainTransaction} from './chain.mjs';
import {validateAnchor} from './anchor.mjs';
import {TransactionJournal,JOURNAL_KEY} from './transactions.mjs';
import {isAddress,keccak256,encodeAbiParameters} from 'viem';

document.querySelector('#app').innerHTML=workspaceView;
const $=id=>document.getElementById(id);
const short=s=>s?s.slice(0,10)+'…'+s.slice(-6):'—';
const safe=s=>String(s??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const same=(a,b)=>typeof a==='string'&&typeof b==='string'&&a.toLowerCase()===b.toLowerCase();
const isLoopback=['127.0.0.1','localhost','[::1]'].includes(location.hostname);
let storage;try{storage=window.localStorage;}catch{}
const journal=new TransactionJournal(storage);
let mode='artifact',connection=null,manifest=null,anchor=null,busy=false,revision=0;
let integrity=null,chainState='idle',lastTransaction=journal.current,recoveredRegistration=null;
$('source').value=SAMPLE;

function notify(message,error=false){$('notice').textContent=message;$('notice').className='notice'+(error?' error':'');}
function download(name,value){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);}
const matches=(c,a)=>!!c&&!!a&&c.chainId===a.chainId&&same(c.address,a.address);
const canWrite=()=>!!connection&&(connection.mode==='local'&&!!connection.owner||!!connection.owner&&typeof connection.signer==='function');
const unresolved=()=>!!journal.current||!!journal.error;
const lockSupported=()=>typeof window.navigator.locks?.request==='function';
function controls(){
  const has=!!manifest,writing=canWrite()&&lockSupported()&&!unresolved(),pending=anchor?.verified&&anchor.status===1&&Number(anchor.expiresAt)>=Date.now()/1000;
  for(const id of ['run','loadExample','connect','artifact','monad','import'])$(id).disabled=busy;
  $('local').disabled=busy||!isLoopback;$('readonly').disabled=busy||mode!=='monad';
  $('source').disabled=$('output').disabled=$('address').disabled=$('reviewer').disabled=busy;
  for(const id of ['verify','tamper','restore','export','compare'])$(id).disabled=busy||!has;
  $('restoreSource').disabled=busy||!has||$('source').value===manifest.input;
  $('publish').disabled=busy||!has||!writing||!!anchor||$('source').value!==manifest.input||!verifyManifest(manifest,$('output').value).valid;
  $('deploy').disabled=busy||mode!=='monad'||!writing;
  $('accept').disabled=$('reject').disabled=busy||!writing||!matches(connection,anchor)||!pending;
  $('revoke').disabled=busy||!writing||!matches(connection,anchor)||!anchor?.verified||anchor.status===4;
  $('recover').disabled=busy||!journal.current;$('copyTransaction').disabled=!lastTransaction;
  $('stepPrepare').classList.toggle('complete',has);
  $('stepInspect').classList.toggle('complete',!!integrity?.valid);
  $('stepVerify').classList.toggle('complete',!!anchor?.verified);
  $('stepReview').classList.toggle('complete',!!anchor?.verified&&[2,3].includes(anchor.status));
  if(manifest)$('checkSummary').textContent=$('source').value!==manifest.input?'Checks refer to the committed source':$('checkSummary').dataset.original;
  $('publishHint').textContent=unresolved()?'Recover the outstanding transaction before any new write.':anchor?'This delivery already has receipt coordinates. Create a new delivery to publish new work.':!has?'Run the checking agent or import an unanchored package first.':!canWrite()?'Connect a publisher wallet or the local demo to publish this delivery.':$('source').value!==manifest.input?'Source changed. Restore the committed source or run a new delivery.':!verifyManifest(manifest,$('output').value).valid?'Restore the original delivery before publication.':'Ready to anchor this unchanged delivery with a designated reviewer.';
  if(canWrite()&&!lockSupported())$('publishHint').textContent='This browser cannot coordinate safe writes across tabs. Use a browser with Web Locks support. Read-only checks remain available.';
}
function showTransaction(){
  const record=journal.current??lastTransaction;
  $('transactionPanel').hidden=!record&&!journal.error;
  if(!record){$('transactionText').textContent=journal.error;$('recover').disabled=true;return;}
  const waiting=!!journal.current;
  $('transactionPanel').classList.toggle('resolved',!waiting);
  $('transactionTitle').textContent=waiting?'Transaction recovery':'Last transaction';
  $('transactionHash').textContent=record.hash;
  $('transactionText').textContent=waiting?(busy&&record.state==='broadcast'?'Broadcast recorded. Waiting for confirmations; keep this hash.':'Result unknown until recovery. Query this transaction’s status. New writes are blocked; do not send it again.'):`${record.state==='confirmed'?'Confirmed':record.state==='reverted'?'Confirmed revert':'Cancelled or replaced'} on ${record.chainId===10143?'Monad Testnet':'local EVM'}.`;
  $('transactionStorage').textContent=journal.error||'Recovery stores public transaction coordinates only. Source text, output and salt are not saved automatically.';
  if(waiting&&record.recoveryHint)$('transactionText').textContent+=' '+record.recoveryHint;
  $('recover').hidden=!waiting;
}
function recordTransaction(record){
  lastTransaction=record;
  try{journal.record(record);}finally{
    if(record.kind==='publishReceipt'&&record.context?.taskId===manifest?.taskId&&record.context.receiptId){
      anchor=validateAnchor({chainId:record.chainId,address:record.request.to,receiptId:record.context.receiptId,publishTx:record.hash});chainState='unchecked';showAnchor();
    }
    if(['reviewReceipt','revokeReceipt'].includes(record.kind)&&matches(connection,anchor))downgradeAnchor(record.state==='unknown'?'error':'unchecked');
    showTransaction();controls();
  }
}
function finishTransaction(){
  if(journal.current){lastTransaction={...journal.current,state:'confirmed'};journal.resolve();}
  if(connection)connection.pendingTransaction=null;
  showTransaction();
}
function requireWrite(){
  journal.assertCanWrite();
  if(!canWrite())throw new Error('Connect a publisher or reviewer wallet before this write.');
}
async function action(task){
  if(busy)return;
  busy=true;controls();
  try{await task();}
  catch(error){
    if(error.transaction){
      try{recordTransaction(error.transaction);}catch{$('transactionStorage').textContent='Storage failed. Keep this tab open and save the recovery record before leaving.';}
      if(['reverted','replaced'].includes(error.transaction.state)){
        lastTransaction=error.transaction;
        try{journal.resolve();if(connection)connection.pendingTransaction=null;}catch{}
        if(error.transaction.kind==='publishReceipt'&&same(anchor?.publishTx,error.transaction.hash)){anchor=null;showAnchor();}
      }
    }else if(journal.current?.state==='confirmed'){
      // Receipt processing can fail after a successful wait. Keep recovery available.
      try{recordTransaction({...journal.current,state:'unknown'});}catch{}
    }
    const message=error.shortMessage||error.message;
    notify(chainState==='error'&&!error.transaction?'Live chain verification is unavailable. Local contents are retained. Retry Verify delivery or reconnect to the recorded registry. '+message:message,true);
  }finally{busy=false;showTransaction();showAnchor();controls();}
}
const writeAction=task=>action(()=>journal.withWriteLock(task,window.navigator.locks));
function layer(id,state){$(id).dataset.state=state;}
function showIntegrity(){
  $('integrityState').textContent=!manifest?'Not checked':!integrity?'Needs recheck':integrity.valid?'Matches commitments':'Content mismatch';
  $('integrityHint').textContent=integrity?.reason??(manifest?'Recompute the displayed source and delivery before trusting their contents.':'Do the exact source, output and policy match?');
  layer('integrityLayer',!integrity?'idle':integrity.valid?'good':'bad');
}
function showHashes(){
  $('hashes').innerHTML=['input','output','policy'].map(k=>`<dt>${k[0].toUpperCase()+k.slice(1)} commitment</dt><dd>${safe(manifest.commitments[k])}</dd>`).join('');
}
function showAnchor(){
  const verified=!!anchor?.verified,revoked=verified&&anchor.status===4;
  $('receiptState').textContent=!manifest&&!anchor?'Awaiting a delivery':!anchor?'Local delivery / not anchored':verified?(revoked?'Live receipt / revoked':'Live receipt / verified'):chainState==='error'?'Chain unavailable / unverified':'Imported / unverified';
  $('receiptCaption').textContent=!anchor?'Source, output and policy are committed separately. Nothing has been published for this delivery.':verified?'Live evidence belongs to the committed original. Inspect content integrity separately.':'Package coordinates are lookup hints. File-supplied identities and decisions are untrusted.';
  $('anchorState').textContent=!anchor?'Not anchored':chainState==='checking'?'Checking live chain…':!verified?(chainState==='error'?'Unavailable / unverified':'Not verified'):revoked?'Revoked on chain':`Verified on ${anchor.chainId===10143?'Monad Testnet':'local EVM'}`;
  $('anchorHint').textContent=!anchor?'Publish or import a receipt to check its chain anchor.':!verified?'Connect to the recorded registry and query its current receipt.':revoked?'The publisher revoked this receipt. Its original commitments still exist.':`Publication and live commitments checked${anchor.checkedAt?' at '+new Date(anchor.checkedAt).toLocaleTimeString():''}.`;
  $('reviewState').textContent=!anchor?'Not recorded':!verified?'Unknown / unverified':revoked?'Unavailable after revocation':STATUS[anchor.status]??'Unknown';
  $('decisionHint').textContent=!verified?'A live chain query is required to establish the current decision.':revoked?'Revocation supersedes the receipt’s usable review state.':anchor.status===1?(Number(anchor.expiresAt)<Date.now()/1000?'Review window expired without a recorded decision.':'Only the designated reviewer wallet can accept or reject.'): 'The designated wallet recorded this decision. Acceptance does not establish factual accuracy.';
  layer('anchorLayer',!verified?(chainState==='error'?'warning':'idle'):revoked?'bad':'good');
  layer('reviewLayer',!verified?'idle':anchor.status===2?'good':anchor.status===3||revoked?'warning':'idle');
  $('reviewHint').textContent=unresolved()?'Recover the outstanding transaction before recording another decision.':!verified?'Verify the live receipt, then connect the designated reviewer’s wallet.':revoked?'This receipt is revoked. Review and revocation actions are closed.':anchor.status!==1?'The reviewer’s decision is already recorded. The publisher may still revoke.':Number(anchor.expiresAt)<Date.now()/1000?'The review deadline has passed. This receipt cannot receive a new decision.':!canWrite()?'Read-only connection. Connect the designated reviewer’s test wallet to record a decision.':'Accept or reject with the designated reviewer wallet. The publisher can revoke.';
  if(!anchor){$('chainEvidence').innerHTML='<p class="caption">No publication coordinates in this workspace.</p>';return;}
  const values={Network:anchor.chainId,Registry:anchor.address,Receipt:anchor.receiptId,[verified?'Publish transaction':'Claimed publish transaction']:anchor.publishTx};
  if(verified)Object.assign(values,{Agent:anchor.agentId,Publisher:anchor.owner,Reviewer:anchor.reviewer,'Publish block':anchor.blockNumber,'Review deadline':new Date(Number(anchor.expiresAt)*1000).toISOString(),'Review evidence hash':anchor.reviewEvidenceHash,'Live checked at':anchor.checkedAt});
  $('chainEvidence').innerHTML=Object.entries(values).map(([k,v])=>`<dt>${safe(k)}</dt><dd>${safe(v)}</dd>`).join('');
  if(anchor.chainId===10143){const a=document.createElement('a');a.href=`https://testnet.monadvision.com/tx/${anchor.publishTx}`;a.target='_blank';a.rel='noopener noreferrer';a.textContent=verified?'Open verified publication':'Inspect claimed publication';$('chainEvidence').append(a);}
}
function downgradeAnchor(state='unchecked'){
  if(anchor)anchor=validateAnchor(anchor);chainState=state;showAnchor();
}
async function refresh(){
  const lookup=validateAnchor(anchor),start=revision,c=connection,m=manifest;
  downgradeAnchor('checking');controls();
  try{
    const fresh=await verifyChainAnchor(c,m,lookup);
    if(start!==revision||c!==connection||m!==manifest||!matches(c,lookup))throw new Error('Workspace changed during chain verification. Verify again.');
    anchor={...fresh,checkedAt:new Date().toISOString()};chainState='verified';showAnchor();return anchor;
  }catch(error){downgradeAnchor('error');throw error;}
}
function invalidate(message){revision++;integrity=null;showIntegrity();$('verificationResult').textContent=message;$('verificationResult').dataset.state='idle';updateVersions();controls();}
function updateVersions(){
  if(!manifest)return;
  const original=manifest.output,current=$('output').value,left=original.split('\n'),right=current.split('\n');
  let differences=0;for(let i=0;i<Math.max(left.length,right.length);i++)if(left[i]!==right[i])differences++;
  $('versionBadge').textContent=original===current?'Committed original':'Edited version';$('versionBadge').classList.toggle('changed',original!==current);
  $('diffSummary').textContent=original===current?'Exact text match. The current version is identical to the committed original.':`${differences} line position${differences===1?' differs':'s differ'}. Highlighted text is changed; verification checks the full artifact.`;
  const preview=(lines,other)=>lines.slice(0,400).map((line,i)=>`<span class="diffLine${line!==other[i]?' changed':''}"><span class="lineNumber" aria-hidden="true">${i+1}</span>${safe(line)||' '}</span>`).join('');
  $('originalVersion').innerHTML=preview(left,right);$('currentVersion').innerHTML=preview(right,left);
  if(Math.max(left.length,right.length)>400)$('diffSummary').textContent+=' Preview shows the first 400 lines.';
}
function deliveryView(compare){
  $('deliveryTab').setAttribute('aria-selected',String(!compare));$('compare').setAttribute('aria-selected',String(compare));
  $('deliveryEditor').hidden=compare;$('comparePanel').hidden=!compare;updateVersions();
}
function newDelivery(m){
  manifest=m;anchor=null;chainState='idle';$('packageDetails').hidden=true;
  $('source').value=m.input;$('output').value=m.output;$('policyText').textContent=m.policy;showHashes();
  let report;try{report=JSON.parse(m.output);}catch{}
  const checklist=report?.agent==='Checklist agent v1 (deterministic, no LLM)'&&Array.isArray(report.checks)&&report.checks.length<=50&&report.checks.every(c=>c&&typeof c.label==='string'&&['found','missing'].includes(c.status)&&(c.evidence===null||typeof c.evidence==='string'));
  $('checks').innerHTML=checklist?report.checks.map(c=>`<div class="check"><span class="checkMark ${c.status}" aria-hidden="true">${c.status==='found'?'✓':'?'}</span><div><b>${safe(c.label)}</b><small>${c.evidence?'Matched “'+safe(c.evidence)+'”':'Missing from the brief'}</small></div><span class="checkLabel ${c.status}">${c.status==='found'?'Found':'Missing'}</span></div>`).join(''):'<p class="emptyState">Imported agent output is shown below. Its checking policy is included in this package.</p>';
  $('checkSummary').textContent=checklist?`${report.checks.filter(c=>c.status==='found').length} found / ${report.checks.filter(c=>c.status==='missing').length} missing`:'Custom agent output';
  $('checkSummary').dataset.original=$('checkSummary').textContent;
  deliveryView(false);showAnchor();invalidate('Delivery ready. Verify the exact contents before relying on them.');
}
function switchMode(next,initial=false){
  if(next==='local'&&!isLoopback){notify('Open the localhost app to use the disposable local EVM.');return;}
  mode=next;connection=null;downgradeAnchor();
  $('monadSettings').hidden=next!=='monad';
  for(const id of ['artifact','local','monad']){$(id).classList.toggle('selected',next===id);$(id).setAttribute('aria-pressed',String(next===id));}
  $('connect').hidden=next==='artifact';$('connect').textContent=next==='local'?'Connect local demo':'Connect Testnet wallet';
  $('network').textContent=next==='artifact'?'Artifact checks / no chain':next==='local'?'Local EVM / disconnected':'Monad Testnet / disconnected';
  $('connectionSummary').textContent=next==='artifact'?'Artifact checks, no wallet':next==='local'?'Disposable local EVM':'Monad Testnet';
  $('connectionText').textContent=next==='artifact'?'Run, verify and export without a wallet. Local EVM requires the localhost app.':next==='local'?'Start npm run demo, then connect to the disposable chain.':'Use the registry address for read-only verification, or connect a test wallet.';
  if(!initial){revision++;$('verificationResult').textContent='Connection changed. Chain status unverified; connect to the recorded registry and verify again.';}controls();
}
async function connectReadonly(){
  connection=null;downgradeAnchor('checking');
  try{connection=await readOnlyMonadConnection($('address').value.trim());chainState='unchecked';}
  catch(error){downgradeAnchor('error');throw error;}
  $('network').textContent='Monad Testnet / read-only';$('connectionSummary').textContent='Monad Testnet, read-only';$('connectionText').textContent=`Registry ${short(connection.address)} · wallet-free verification`;showAnchor();
}
function localCheck(){
  const result=verifyManifest(manifest,$('output').value);
  if($('source').value!==manifest.input)return {valid:false,reason:'Displayed source differs from this receipt. Restore the source or run a new delivery.'};
  return result;
}
async function verify(){
  if(!manifest)throw new Error('Create or load a delivery before verification.');
  const start=revision,output=$('output').value;
  integrity=localCheck();showIntegrity();let message=integrity.reason,usable=integrity.valid;
  if(anchor&&mode!=='artifact'){
    if(!connection&&anchor.chainId===10143&&same($('address').value.trim(),anchor.address)){
      try{await connectReadonly();}catch(error){$('verificationResult').textContent=message+' · Chain status unavailable; reviewer decision unknown. Retry Verify delivery.';$('verificationResult').dataset.state='warning';throw error;}
    }
    if(!matches(connection,anchor)){downgradeAnchor();$('verificationResult').textContent=message+' · Chain status unverified. Connect to the proof package network and registry.';throw new Error('Connect to the proof package network and registry before chain verification');}
    $('verificationResult').textContent='Content check completed. Querying the live registry…';
    try{const live=await refresh();usable=usable&&live.status!==4;message+=live.status===4?' · Live receipt revoked; its chain validity is withdrawn.':` · Verified against live contract. Review: ${STATUS[live.status]}.`;}
    catch(error){$('verificationResult').textContent=message+' · Chain status unavailable; reviewer decision unknown. Retry live verification.';$('verificationResult').dataset.state='warning';throw error;}
  }else message+=anchor?' · Chain status unverified (artifact checks only)':' · Not anchored on a chain';
  if(start!==revision||output!==$('output').value){invalidate('Content changed during verification. Verify again.');return false;}
  $('verificationResult').textContent=message;$('verificationResult').dataset.state=usable?'good':integrity.valid?'warning':'bad';controls();return usable;
}
function loadPackage(value){
  const check=verifyManifest(value?.manifest,value?.manifest?.output);if(!check.valid)throw new Error('Invalid proof package: '+check.reason);
  const imported=value.anchor?validateAnchor(value.anchor):null;
  if(imported?.chainId===10143){switchMode('monad');$('address').value=imported.address;}
  else if(imported?.chainId===31337&&isLoopback)switchMode('local');
  else switchMode('artifact');
  newDelivery(value.manifest);anchor=imported;integrity=check;chainState='unchecked';showIntegrity();showAnchor();controls();
}
function parsePackage(text){try{return JSON.parse(text);}catch{throw new Error('Invalid JSON package. Choose an exported AgentProof .json file.');}}

for(const id of ['artifact','local','monad'])$(id).onclick=()=>{if(!busy)switchMode(id);};
$('connect').onclick=()=>action(async()=>{
  connection=null;downgradeAnchor();
  connection=mode==='local'?await localConnection():await monadConnection($('address').value.trim());
  const registered=recoveredRegistration;if(registered&&connection.chainId===registered.chainId&&same(connection.address,registered.address)&&same(connection.owner,registered.owner))connection.agentId=registered.agentId;
  $('network').textContent=mode==='local'?'Local EVM / 31337':'Monad Testnet / wallet';$('connectionSummary').textContent=mode==='local'?'Local EVM connected':'Monad Testnet, wallet connected';$('connectionText').textContent=`Publisher ${short(connection.owner)} · Registry ${short(connection.address)}`;
  if(mode==='local')$('reviewer').value=connection.reviewer;
  showAnchor();notify(mode==='local'?'Connected to the disposable local EVM. These are sandbox accounts.':'Connected to Monad Testnet. Every write requires the correct test-wallet account and approval.');
});
$('readonly').onclick=()=>action(async()=>{await connectReadonly();notify('Read-only Monad connection. Verify without a wallet; publishing and review require a test wallet.');});
$('address').oninput=()=>{connection=null;downgradeAnchor();$('network').textContent='Monad Testnet / disconnected';$('connectionText').textContent='Registry changed. Connect again before verification or any write.';revision++;$('verificationResult').textContent='Registry address changed. Connect again before live verification.';controls();};
$('run').onclick=()=>{
  if(busy)return;
  try{newDelivery(createManifest($('source').value));notify('Delivery created by deterministic presence rules. Missing fields remain visible. No LLM was used.');controls();}
  catch(error){notify(error.message+' Add a source brief before running the checking rules.',true);}
};
$('loadExample').onclick=()=>action(async()=>{
  notify('Loading the synthetic Monad proof package, then querying the live chain…');
  const response=await fetch('./agentproof-monad-proof.json',{signal:AbortSignal.timeout(20000),cache:'no-store'});
  if(!response.ok)throw new Error('Example package unavailable. Retry loading it or import a saved package.');
  const text=await response.text();if(text.length>1000000)throw new Error('Example proof package is too large');
  const proof=parsePackage(text);if(proof.anchor?.chainId!==10143)throw new Error('The example must contain Monad Testnet receipt coordinates');
  loadPackage(proof);await connectReadonly();await verify();
  notify('Monad example loaded and freshly checked against the live registry. Review the three states separately.');
});
$('verify').onclick=()=>action(verify);
$('source').oninput=()=>invalidate('Source edited. Restore the committed source or run the checking agent to create a new delivery.');
$('output').oninput=()=>invalidate('Delivery changed. Compare versions, then verify the exact current text.');
$('restoreSource').onclick=()=>{if(busy||!manifest)return;$('source').value=manifest.input;invalidate('Committed source restored. Verify again.');};
$('tamper').onclick=()=>{if(busy||!manifest)return;$('output').value=manifest.output+'\nChanged after delivery.';invalidate('Tampered version created for inspection. Verify to detect the changed commitment.');deliveryView(true);};
$('restore').onclick=()=>{if(busy||!manifest)return;$('output').value=manifest.output;invalidate('Original delivery restored. Verify again.');};
$('compare').onclick=()=>deliveryView(true);$('deliveryTab').onclick=()=>deliveryView(false);
for(const id of ['compare','deliveryTab'])$(id).onkeydown=event=>{if(['ArrowLeft','ArrowRight'].includes(event.key)&&manifest){event.preventDefault();const compare=id==='deliveryTab';deliveryView(compare);$(compare?'compare':'deliveryTab').focus();}};

const txOptions=context=>({onUpdate:recordTransaction,context});
$('deploy').onclick=()=>writeAction(async()=>{
  requireWrite();if(mode!=='monad')throw new Error('Deployment requires Monad Testnet mode');
  downgradeAnchor();
  notify('Approve registry deployment in your test wallet. The broadcast hash will be saved before waiting.');
  const deployment=await deployMonad(connection,txOptions());finishTransaction();$('address').value=deployment.address;downgradeAnchor();
  $('connectionText').textContent=`Publisher ${short(connection.owner)} · Registry ${short(connection.address)}`;
  $('deploymentText').value=JSON.stringify(deployment,null,2);$('deploymentDetails').hidden=false;$('deploymentDetails').open=true;
  download('agentproof-monad-deployment.json',deployment);notify('Registry deployment confirmed. Public coordinates are available as a download and copy backup.');
});
$('publish').onclick=()=>writeAction(async()=>{
  requireWrite();if(!manifest)throw new Error('Create a delivery before publication');
  if(anchor)throw new Error('This delivery already has publication coordinates. Verify or recover it instead of publishing again.');
  if($('source').value!==manifest.input)throw new Error('Displayed source changed. Restore the source or run the agent again before publishing.');
  if(!localCheck().valid)throw new Error('Restore the original delivery before publishing');
  const reviewer=mode==='local'?connection.reviewer:$('reviewer').value.trim();
  if(!isAddress(reviewer)||same(reviewer,connection.owner)||/^0x0{40}$/i.test(reviewer))throw new Error('Choose a valid, nonzero reviewer wallet different from the publisher');
  if(!connection.agentId){notify('Approve agent registration in your test wallet.');await register(connection,txOptions());finishTransaction();}
  const block=await connection.publicClient.getBlock(),expiresAt=block.timestamp+86400n,c=manifest.commitments;
  const receiptId=keccak256(encodeAbiParameters([{type:'uint256'},{type:'address'},{type:'bytes32'},{type:'bytes32'}],[BigInt(connection.chainId),connection.address,connection.agentId,manifest.taskId]));
  notify('Approve receipt publication. Its broadcast hash is saved immediately; a timeout requires recovery.');
  const receipt=await transact(connection,connection.owner,'publishReceipt',[connection.agentId,manifest.taskId,c.input,c.output,c.policy,reviewer,expiresAt],txOptions({taskId:manifest.taskId,receiptId}));
  anchor=validateAnchor({chainId:connection.chainId,address:connection.address,receiptId:publishedId(receipt),publishTx:receipt.transactionHash});finishTransaction();
  await verify();notify(`Publication confirmed in block ${receipt.blockNumber} on ${mode==='local'?'local EVM':'Monad Testnet'}. Inspect integrity and review independently.`);
});
function requireReceipt(){if(!matches(connection,anchor))throw new Error('Connect to this receipt’s network and registry before reviewing or revoking.');}
async function review(accepted){
  requireWrite();requireReceipt();await refresh();
  if(anchor.status!==1)throw new Error('This receipt is no longer pending review');
  if(Number(anchor.expiresAt)<Date.now()/1000)throw new Error('The review window has expired');
  if(accepted&&!(await verify()))throw new Error('Acceptance requires an unchanged delivery with a valid live receipt');
  const evidence=artifactHash(JSON.stringify({receiptId:anchor.receiptId,accepted,output:manifest.commitments.output}),manifest.salt,'review');
  const live=anchor;downgradeAnchor();
  notify('Approve the decision with the designated reviewer’s test wallet.');
  await transact(connection,live.reviewer,'reviewReceipt',[live.receiptId,accepted,evidence],txOptions({receiptId:live.receiptId}));finishTransaction();await verify();
  notify('Reviewer decision confirmed. Content integrity and reviewer opinion are separate.');
}
$('accept').onclick=()=>writeAction(()=>review(true));$('reject').onclick=()=>writeAction(()=>review(false));
$('revoke').onclick=()=>writeAction(async()=>{
  requireWrite();requireReceipt();await refresh();if(anchor.status===4)throw new Error('Receipt is already revoked');
  const live=anchor;downgradeAnchor();
  await transact(connection,live.owner,'revokeReceipt',[live.receiptId],txOptions({receiptId:live.receiptId}));finishTransaction();await verify();
  notify('Publisher revocation confirmed. Original commitments remain intact; chain validity is withdrawn.');
});
$('recover').onclick=()=>action(()=>journal.withRecoveryLock(async()=>{
  const record=journal.current;if(!record)throw new Error('No transaction is awaiting recovery');
  notify('Querying the saved transaction. This recovery does not request a wallet or broadcast a transaction.');
  const recovered=await recoveryConnection(record),result=await recoverChainTransaction(recovered,record,{onUpdate:recordTransaction});
  const old=connection;connection=old&&old.chainId===recovered.chainId&&same(old.address,recovered.address)?old:recovered;
  if(connection)connection.pendingTransaction=null;
  if(record.kind==='registerAgent'){
    recoveredRegistration={chainId:record.chainId,address:record.request.to,owner:record.request.from,agentId:result.agentId};
    if(same(connection.owner,record.request.from))connection.agentId=result.agentId;
  }
  if(record.kind==='deploy'){
    mode='monad';$('monadSettings').hidden=false;connection=recovered;$('address').value=result.deployment.address;downgradeAnchor();
    $('deploymentText').value=JSON.stringify(result.deployment,null,2);$('deploymentDetails').hidden=false;$('deploymentDetails').open=true;
  }
  mode=record.chainId===10143?'monad':'local';$('monadSettings').hidden=mode!=='monad';
  for(const id of ['artifact','local','monad']){$(id).classList.toggle('selected',mode===id);$(id).setAttribute('aria-pressed',String(mode===id));}
  $('connect').hidden=false;$('connect').textContent=mode==='local'?'Connect local demo':'Connect Testnet wallet';
  if(record.kind!=='deploy'&&record.chainId===10143)$('address').value=record.request.to;
  if(record.kind==='publishReceipt'&&manifest?.taskId===record.context.taskId){
    anchor=validateAnchor({chainId:record.chainId,address:record.request.to,receiptId:result.receiptId,publishTx:result.receipt.transactionHash});mode=record.chainId===10143?'monad':'local';
  }
  finishTransaction();
  $('network').textContent=`${record.chainId===10143?'Monad Testnet':'Local EVM'} / recovered`;
  $('connectionSummary').textContent=`${record.chainId===10143?'Monad Testnet':'Local EVM'}, recovered`;
  $('connectionText').textContent=`Recovered ${record.kind} transaction ${short(record.hash)}. No new transaction sent.`;
  if(manifest&&anchor&&matches(connection,anchor))await verify();
  notify(record.kind==='registerAgent'?'Registration recovered. No publication was sent. Connect the publisher wallet and publish when ready.':record.kind==='publishReceipt'&&manifest?.taskId!==record.context.taskId?'Publication recovered. Import its matching proof package to verify the artifacts.':'Saved transaction confirmed and recovered. No transaction was sent again.');
},window.navigator.locks));
$('copyTransaction').onclick=()=>{if(lastTransaction)download('agentproof-transaction-recovery.json',lastTransaction);};
$('export').onclick=()=>{
  if(busy||!manifest)return;
  const value={manifest,anchor:anchor?validateAnchor(anchor):null};$('packageText').value=JSON.stringify(value,null,2);$('packageDetails').hidden=false;$('packageDetails').open=true;
  download('agentproof-package.json',value);notify('Original proof package prepared for download and copy backup. It includes the source, delivery and salt.');
};
$('import').onchange=()=>action(async()=>{
  try{
    const file=$('import').files[0];if(!file)return;if(file.size>1000000)throw new Error('Proof package must be under 1 MB. Choose a smaller exported JSON file.');
    loadPackage(parsePackage(await file.text()));notify(anchor?'Proof package imported. Its artifact commitments match; connect and verify the live chain.':'Proof package imported. Its artifacts match; this package has no chain anchor.');
  }finally{$('import').value='';}
});
window.addEventListener('storage',event=>{
  if(event.key!==JOURNAL_KEY)return;
  // A second tab's unresolved write must also block this workspace.
  const reloaded=new TransactionJournal(storage);journal.current=reloaded.current;journal.error=reloaded.error;lastTransaction=journal.current??lastTransaction;
  showTransaction();showAnchor();controls();
});
switchMode(mode,true);showIntegrity();showTransaction();controls();
