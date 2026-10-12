import {test} from 'node:test';
import assert from 'node:assert/strict';
import {TransactionJournal,JOURNAL_KEY,trackTransaction,recoverTrackedTransaction} from '../src/transactions.mjs';

const hash='0x'+'33'.repeat(32),from='0x'+'11'.repeat(20),to='0x'+'22'.repeat(20);
const details={kind:'publishReceipt',chainId:10143,request:{from,to,data:'0x1234'},context:{taskId:'0x'+'44'.repeat(32)}};
const record={...details,version:'agentproof/transaction/1',hash,state:'unknown',startedAt:'2026-10-12T00:00:00.000Z'};
const storage=()=>{const values=new Map();return {getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};};

test('broadcast journal survives reload and never silently permits another write',()=>{
  const disk=storage(),journal=new TransactionJournal(disk);
  journal.assertCanWrite();journal.record(record);
  const reloaded=new TransactionJournal(disk);
  assert.equal(reloaded.current.hash,hash);
  assert.throws(()=>reloaded.assertCanWrite(),/recover|unresolved/i);
  assert.equal(JSON.stringify(reloaded.current).includes('salt'),false);
  reloaded.resolve();reloaded.assertCanWrite();
});
test('unavailable storage and malformed recovery data block signing instead of dropping the record',()=>{
  const journal=new TransactionJournal({getItem:()=>null,setItem:()=>{throw new Error('quota');},removeItem:()=>{}});
  assert.throws(()=>journal.assertCanWrite(),/storage|recovery/i);
  assert.throws(()=>journal.record(record),/storage|recovery/i);
  assert.equal(journal.current.hash,hash);
  const disk=storage();disk.setItem(JOURNAL_KEY,'{"hash":"fake"}');
  const corrupt=new TransactionJournal(disk);
  assert.match(corrupt.error,/recovery/i);assert.throws(()=>corrupt.assertCanWrite(),/recovery/i);
});
test('wallet rejection happens before a record exists; receipt failure preserves a real hash',async()=>{
  const updates=[];
  await assert.rejects(trackTransaction({},async()=>{throw new Error('User rejected signature');},details,r=>updates.push(r)),/rejected/i);
  assert.equal(updates.length,0);
  let sends=0;
  await assert.rejects(trackTransaction({waitForTransactionReceipt:async()=>{throw new Error('offline');}},async()=>{sends++;return hash;},details,r=>updates.push(r)),e=>e.transaction.hash===hash&&e.transaction.state==='unknown');
  assert.equal(sends,1);assert.deepEqual(updates.map(r=>r.state),['broadcast','unknown']);
});
test('a storage failure after broadcast keeps its hash in the uncertain error',async()=>{
  let waits=0;
  await assert.rejects(trackTransaction({waitForTransactionReceipt:async()=>{waits++;}},async()=>hash,details,()=>{throw new Error('quota');}),e=>e.transaction.hash===hash&&/unknown/i.test(e.message));
  assert.equal(waits,0);
});
test('recovery only queries the original hash and requires the requested call and confirmations',async()=>{
  const reads=[];
  const client={getChainId:async()=>10143,getTransaction:async args=>{reads.push(args.hash);return {hash,from,to,input:'0x1234'};},getTransactionReceipt:async args=>{reads.push(args.hash);return {transactionHash:hash,from,to,status:'success',blockNumber:10n};},getBlockNumber:async()=>11n};
  assert.equal((await recoverTrackedTransaction(client,record)).blockNumber,10n);
  assert.deepEqual(reads,[hash,hash]);
  await assert.rejects(recoverTrackedTransaction({...client,getBlockNumber:async()=>10n},record),/unknown|confirmation/i);
  await assert.rejects(recoverTrackedTransaction({...client,getTransaction:async()=>({hash,from,to,input:'0xabcd'})},record),/contents|match/i);
  await assert.rejects(recoverTrackedTransaction({...client,getChainId:async()=>143},record),/chain|network/i);
  await assert.rejects(recoverTrackedTransaction({...client,getTransactionReceipt:async()=>{throw new Error('not found');}},record),e=>e.transaction.hash===hash&&e.transaction.state==='unknown');
});
test('confirmed revert is terminal, while repricing follows the replacement hash',async()=>{
  const updates=[];
  await assert.rejects(trackTransaction({waitForTransactionReceipt:async()=>({transactionHash:hash,status:'reverted',blockNumber:1n})},async()=>hash,details,r=>updates.push(r)),e=>e.transaction.state==='reverted');
  const nextHash='0x'+'55'.repeat(32);
  const receipt=await trackTransaction({waitForTransactionReceipt:async({onReplaced})=>{onReplaced({reason:'repriced',transaction:{hash:nextHash}});return {transactionHash:nextHash,status:'success',blockNumber:2n};}},async()=>hash,details,r=>updates.push(r));
  assert.equal(receipt.transactionHash,nextHash);
  assert.equal(updates.at(-1).hash,nextHash);assert.equal(updates.at(-1).originalHash,hash);
});
test('a wallet cancellation cannot be applied as a successful publication',async()=>{
  const nextHash='0x'+'66'.repeat(32),updates=[];
  await assert.rejects(trackTransaction({waitForTransactionReceipt:async({onReplaced})=>{onReplaced({reason:'cancelled',transaction:{hash:nextHash}});return {transactionHash:nextHash,status:'success',blockNumber:2n};}},async()=>hash,details,r=>updates.push(r)),e=>e.transaction.state==='replaced');
  assert.equal(updates.at(-1).replacementReason,'cancelled');
});

test('sender nonce and scan boundary are saved after broadcast before a receipt timeout',async()=>{
  const updates=[];
  await assert.rejects(trackTransaction({getBlockNumber:async()=>10n,getTransaction:async()=>({hash,from,to,input:'0x1234',nonce:7}),waitForTransactionReceipt:async()=>{throw new Error('timeout');}},async()=>hash,details,r=>updates.push(r)),e=>e.transaction.request.nonce===7&&e.transaction.scanFromBlock==='10');
  assert.equal(updates[0].hash,hash);assert.equal(updates[0].state,'broadcast');assert.equal(updates.at(-1).request.nonce,7);
});
test('recovery discovers a replacement mined after the original wait stopped',async()=>{
  const nextHash='0x'+'77'.repeat(32),updates=[];
  const pending={...record,request:{...record.request,nonce:7},scanFromBlock:'10'};
  const client={getChainId:async()=>10143,getBlockNumber:async()=>12n,getTransactionCount:async()=>8,getTransaction:async()=>{throw new Error('Original dropped');},getBlock:async({blockNumber})=>({number:blockNumber,transactions:blockNumber===11n?[{hash:nextHash,from,to,input:'0x1234',value:0n,nonce:7}]:[]}),getTransactionReceipt:async({hash:queried})=>{assert.equal(queried,nextHash);return {transactionHash:nextHash,status:'success',blockNumber:11n};}};
  const receipt=await recoverTrackedTransaction(client,pending,r=>updates.push(r));
  assert.equal(receipt.transactionHash,nextHash);assert.equal(updates.at(-1).hash,nextHash);assert.equal(updates.at(-1).originalHash,hash);
  assert.equal(updates.at(-1).replacementReason,'repriced');
  await assert.rejects(recoverTrackedTransaction({...client,getBlock:async({blockNumber})=>({number:blockNumber,transactions:blockNumber===11n?[{hash:nextHash,from,to:from,input:'0x',value:0n,nonce:7}]:[]})},pending),e=>e.transaction.state==='replaced'&&e.transaction.replacementReason==='cancelled');
});
test('two tabs serialize signing and cannot overwrite or delete another transaction record',async()=>{
  const disk=storage(),first=new TransactionJournal(disk),second=new TransactionJournal(disk);
  let tail=Promise.resolve(),sends=0;
  const locks={request:(name,callback)=>{assert.equal(name,'agentproof.write.v1');const work=tail.then(callback);tail=work.catch(()=>{});return work;}};
  const send=journal=>journal.withWriteLock(async()=>{await Promise.resolve();sends++;journal.record(record);throw new Error('unknown');},locks);
  const results=await Promise.allSettled([send(first),send(second)]);
  assert.equal(sends,1);assert.equal(results.every(r=>r.status==='rejected'),true);assert.equal(JSON.parse(disk.getItem(JOURNAL_KEY)).hash,hash);
  const other={...record,hash:'0x'+'88'.repeat(32)};disk.setItem(JOURNAL_KEY,JSON.stringify(other));
  assert.throws(()=>first.resolve(),/different|another/i);assert.equal(JSON.parse(disk.getItem(JOURNAL_KEY)).hash,other.hash);
});

test('a second proven replacement can advance the saved hash without losing the original identity',()=>{
  const disk=storage(),journal=new TransactionJournal(disk),next='0x'+'99'.repeat(32),last='0x'+'aa'.repeat(32);
  const first={...record,request:{...record.request,nonce:7},scanFromBlock:'10'};
  journal.record(first);journal.record({...first,hash:next,originalHash:hash,previousHash:hash,replacementReason:'repriced'});
  journal.record({...first,hash:last,originalHash:hash,previousHash:next,replacementReason:'repriced'});
  assert.equal(JSON.parse(disk.getItem(JOURNAL_KEY)).hash,last);assert.equal(journal.current.originalHash,hash);
  assert.throws(()=>journal.record({...first,hash:'0x'+'bb'.repeat(32),originalHash:hash,previousHash:last,request:{...first.request,nonce:8}}),/storage|record/i);
});
test('recovery revisits corrected recent history instead of permanently skipping it',async()=>{
  const next='0x'+'cc'.repeat(32);let canonical=false,latest;
  const pending={...record,request:{...record.request,nonce:7},scanFromBlock:'10'};
  const client={getChainId:async()=>10143,getBlockNumber:async()=>12n,getTransactionCount:async()=>8,getTransaction:async()=>{throw new Error('Original dropped');},getBlock:async({blockNumber})=>({number:blockNumber,hash:'0x'+(canonical?'ee':'dd').repeat(32),transactions:canonical&&blockNumber===11n?[{hash:next,from,to,input:'0x1234',value:0n,nonce:7}]:[]}),getTransactionReceipt:async()=>({transactionHash:next,status:'success',blockNumber:11n})};
  await assert.rejects(recoverTrackedTransaction(client,pending,r=>{latest=r;}),/unknown/i);
  canonical=true;
  const recovered=await recoverTrackedTransaction(client,latest,r=>{latest=r;});
  assert.equal(recovered.transactionHash,next);assert.equal(latest.hash,next);
});
