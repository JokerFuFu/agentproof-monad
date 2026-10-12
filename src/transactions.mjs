import {isAddress} from 'viem';

export const JOURNAL_KEY='agentproof.pending-transaction.v1';
const kinds=['deploy','registerAgent','publishReceipt','reviewReceipt','revokeReceipt'];
const same=(a,b)=>typeof a==='string'&&typeof b==='string'&&a.toLowerCase()===b.toLowerCase();
const hash=value=>typeof value==='string'&&/^0x[0-9a-f]{64}$/i.test(value);
const confirmations=record=>record.chainId===10143?2:1;

export function validateTransaction(record) {
  if(record?.version!=='agentproof/transaction/1'||!hash(record.hash)||![31337,10143].includes(record.chainId)||!kinds.includes(record.kind))throw new Error('Invalid transaction recovery record');
  if(!['broadcast','unknown','confirmed','reverted','replaced'].includes(record.state))throw new Error('Invalid transaction recovery state');
  const request=record.request;
  if(!isAddress(request?.from)||(record.kind==='deploy'?request.to!==null:!isAddress(request?.to))||typeof request?.data!=='string'||!/^0x(?:[0-9a-f]{2})+$/i.test(request.data))throw new Error('Invalid recovery transaction contents');
  if(record.originalHash&&!hash(record.originalHash))throw new Error('Invalid replacement transaction hash');
  if(record.previousHash&&!hash(record.previousHash))throw new Error('Invalid previous transaction hash');
  if(record.replacementReason&&!['repriced','cancelled','replaced'].includes(record.replacementReason))throw new Error('Invalid replacement reason');
  if(request.nonce!=null&&(!Number.isSafeInteger(request.nonce)||request.nonce<0))throw new Error('Invalid recovery transaction nonce');
  for(const key of ['scanFromBlock','nextScanBlock'])if(record[key]!=null&&!/^\d+$/.test(record[key]))throw new Error('Invalid recovery block boundary');
  if(record.scanCheckpoint&&(!/^\d+$/.test(record.scanCheckpoint.number)||!hash(record.scanCheckpoint.hash)))throw new Error('Invalid recovery checkpoint');
  return {...record,request:{from:request.from,to:request.to,data:request.data,...(request.nonce!=null?{nonce:request.nonce}:{})},context:record.context??{}};
}

// Only public coordinates and encoded commitments are stored, never raw artifacts.
export class TransactionJournal {
  constructor(storage) {
    this.storage=storage;this.current=null;this.error='';
    try {
      const raw=storage?.getItem(JOURNAL_KEY);
      if(raw){if(raw.length>64000)throw new Error('Oversized record');this.current=validateTransaction(JSON.parse(raw));}
    }catch{this.error='Transaction recovery data could not be read. Preserve the browser record and check its transaction before enabling writes.';}
  }
  assertCanWrite() {
    if(this.error)throw new Error(this.error);
    if(this.current)throw new Error('An unresolved transaction exists. Recover its result before another write.');
    try {
      if(!this.storage)throw new Error('Unavailable');
      // Recheck at the point of signing, including records written by another tab.
      const raw=this.storage.getItem(JOURNAL_KEY);
      if(raw){this.current=validateTransaction(JSON.parse(raw));throw new Error('Unresolved');}
      this.storage.setItem(JOURNAL_KEY+'.probe','1');this.storage.removeItem(JOURNAL_KEY+'.probe');
    }catch {
      if(this.current)throw new Error('An unresolved transaction exists. Recover its result before another write.');
      throw new Error('Browser recovery storage is unavailable. Enable site storage before sending a transaction.');
    }
  }
  record(record) {
    this.current=validateTransaction(record);
    try {
      if(!this.storage)throw new Error('Unavailable');
      const raw=this.storage.getItem(JOURNAL_KEY),saved=raw?validateTransaction(JSON.parse(raw)):null;
      const sameRequest=saved&&saved.chainId===record.chainId&&saved.kind===record.kind&&same(saved.request.from,record.request.from)&&saved.request.to===record.request.to&&same(saved.request.data,record.request.data)&&saved.request.nonce!=null&&saved.request.nonce===record.request.nonce;
      if(saved&&!same(saved.hash,record.hash)&&!same(saved.hash,record.originalHash)&&!(same(saved.hash,record.previousHash)&&sameRequest))throw new Error('Another transaction record is already present');
      this.storage.setItem(JOURNAL_KEY,JSON.stringify(this.current));this.error='';
    }
    catch {this.error='Recovery storage failed after broadcast. Keep this tab open and save the recovery record.';throw new Error(this.error);}
  }
  resolve() {
    const expected=this.current?.hash;
    try {
      if(!this.storage)throw new Error('Unavailable');
      const raw=this.storage.getItem(JOURNAL_KEY),saved=raw?validateTransaction(JSON.parse(raw)):null;
      if(saved&&!same(saved.hash,expected))throw new Error('A different transaction is present');
      this.storage.removeItem(JOURNAL_KEY);
    }catch(error){throw new Error('Recovery storage could not be cleared: '+error.message+'. New writes remain blocked.');}
    this.current=null;this.error='';
  }
  async withWriteLock(task,locks) {
    if(typeof locks?.request!=='function')throw new Error('This browser cannot coordinate safe writes across tabs. Use a browser with Web Locks support; read-only verification remains available.');
    return locks.request('agentproof.write.v1',async()=>{this.assertCanWrite();return task();});
  }
  async withRecoveryLock(task,locks) {
    const run=async()=>{
      try{const raw=this.storage?.getItem(JOURNAL_KEY);if(raw)this.current=validateTransaction(JSON.parse(raw));}catch{}
      return task();
    };
    return typeof locks?.request==='function'?locks.request('agentproof.write.v1',run):run();
  }
}

export class TransactionUnknownError extends Error {
  constructor(transaction,cause) {
    super('Transaction result unknown. Recover this transaction by its saved hash; do not send it again.',{cause});
    this.name='TransactionUnknownError';this.transaction={...transaction,state:'unknown'};
  }
}
export class TransactionTerminalError extends Error {
  constructor(transaction,state,message) {
    super(message);this.name='TransactionTerminalError';this.transaction={...transaction,state};
  }
}

function checkOutcome(record,receipt) {
  if(record.replacementReason&&record.replacementReason!=='repriced')throw new TransactionTerminalError(record,'replaced','The wallet cancelled or replaced this call. The original operation was not confirmed.');
  if(receipt.status!=='success')throw new TransactionTerminalError(record,'reverted','Transaction confirmed as reverted. The operation did not succeed.');
}

export async function trackTransaction(client,submit,details,onUpdate=()=>{}) {
  const scanFromBlock=client.getBlockNumber?(await client.getBlockNumber()).toString():undefined;
  // A rejected signing request has no broadcast hash and no recovery record.
  const transactionHash=await submit();
  let record=validateTransaction({...details,version:'agentproof/transaction/1',hash:transactionHash,state:'broadcast',startedAt:new Date().toISOString(),...(scanFromBlock?{scanFromBlock}:{})});
  let replacementStorageError;
  try {
    onUpdate(record); // Synchronous persistence BEFORE the first receipt wait.
    if(client.getTransaction){
      const transaction=await client.getTransaction({hash:record.hash});
      if(!same(transaction.from,record.request.from))throw new Error('Broadcast transaction sender does not match');
      if(Number.isSafeInteger(transaction.nonce)){
        record={...record,request:{...record.request,nonce:transaction.nonce}};onUpdate(record);
      }
    }
    const receipt=await client.waitForTransactionReceipt({hash:record.hash,confirmations:confirmations(record),timeout:90000,onReplaced:replacement=>{
      record={...record,previousHash:record.hash,originalHash:record.originalHash??record.hash,hash:replacement.transaction.hash,replacementReason:replacement.reason};
      try{onUpdate(record);}catch(error){replacementStorageError=error;}
    }});
    if(replacementStorageError)throw replacementStorageError;
    if(receipt.transactionHash&&!same(receipt.transactionHash,record.hash))throw new Error('Receipt hash differs from the tracked transaction');
    checkOutcome(record,receipt);
    record={...record,state:'confirmed',blockNumber:receipt.blockNumber.toString()};onUpdate(record);
    return receipt;
  }catch(error) {
    const next=error instanceof TransactionTerminalError?error.transaction:{...record,state:'unknown'};
    try{onUpdate(next);}catch{/* The first record and hash remain in memory. */}
    if(error instanceof TransactionTerminalError)throw error;
    throw new TransactionUnknownError(next,error);
  }
}

async function findReplacement(client,record,head,onUpdate) {
  const nonce=record.request.nonce;
  if(nonce==null||record.scanFromBlock==null||!client.getBlock||!client.getTransactionCount)throw new TransactionUnknownError(record,new Error('Replacement identity is not available yet. Keep the saved hash and query again.'));
  const minedNonce=await client.getTransactionCount({address:record.request.from,blockTag:'latest'});
  if(minedNonce<=nonce)throw new TransactionUnknownError(record,new Error('No transaction at this nonce is confirmed yet'));
  if(record.scanCheckpoint){
    const checkpoint=await client.getBlock({blockNumber:BigInt(record.scanCheckpoint.number)});
    if(!same(checkpoint.hash,record.scanCheckpoint.hash)){
      record={...record};delete record.nextScanBlock;delete record.scanCheckpoint;onUpdate(record);
    }
  }
  const boundary=BigInt(record.scanFromBlock),cursor=BigInt(record.nextScanBlock??record.scanFromBlock),recent=head-8n>boundary?head-8n:boundary;
  const start=cursor<recent?cursor:recent,end=head<start+63n?head:start+63n,stable=head-BigInt(confirmations(record)-1);
  for(let at=start;at<=end;at+=4n){
    const numbers=[];for(let i=0n;i<4n&&at+i<=end;i++)numbers.push(at+i);
    const blocks=await Promise.all(numbers.map(blockNumber=>client.getBlock({blockNumber,includeTransactions:true})));
    for(const block of blocks){
      const found=block.transactions.find(tx=>typeof tx==='object'&&same(tx.from,record.request.from)&&tx.nonce===nonce);
      if(!found)continue;
      const toMatches=record.request.to===null?found.to===null:same(found.to,record.request.to);
      const reason=toMatches&&same(found.input,record.request.data)&&BigInt(found.value??0)===0n?'repriced':same(found.from,found.to)&&BigInt(found.value??0)===0n?'cancelled':'replaced';
      const updated=same(found.hash,record.hash)?{...record,state:'unknown'}:{...record,hash:found.hash,previousHash:record.hash,originalHash:record.originalHash??record.hash,replacementReason:reason,state:'unknown'};
      onUpdate(updated);return {record:updated,transaction:found};
    }
    const last=numbers.at(-1),through=last<stable?last:stable,checkpoint=blocks.find(b=>b.number===through);
    record={...record,nextScanBlock:(through+1n).toString(),...(checkpoint&&hash(checkpoint.hash)?{scanCheckpoint:{number:through.toString(),hash:checkpoint.hash}}:{}),recoveryHint:'More chain history may need checking. Recover again to continue the read-only search.'};onUpdate(record);
  }
  throw new TransactionUnknownError(record,new Error('Replacement not found in this read-only search window'));
}

export async function recoverTrackedTransaction(client,input,onUpdate=()=>{}) {
  let record=validateTransaction(input);
  if(await client.getChainId()!==record.chainId)throw new Error('Recovery RPC is on a different chain');
  let transaction,receipt,head;
  try {
    head=await client.getBlockNumber();
    try{transaction=await client.getTransaction({hash:record.hash});}
    catch{const replacement=await findReplacement(client,record,head,onUpdate);record=replacement.record;transaction=replacement.transaction;}
    if(record.request.nonce==null&&Number.isSafeInteger(transaction.nonce)){
      record={...record,request:{...record.request,nonce:transaction.nonce}};onUpdate(record);
    }
    try{receipt=await client.getTransactionReceipt({hash:record.hash});}
    catch{
      const replacement=await findReplacement(client,record,head,onUpdate);record=replacement.record;transaction=replacement.transaction;
      receipt=await client.getTransactionReceipt({hash:record.hash});
    }
  }catch(error){if(error instanceof TransactionUnknownError)throw error;throw new TransactionUnknownError(record,error);}
  if(!same(transaction.hash,record.hash)||!same(transaction.from,record.request.from)||!same(receipt.transactionHash,record.hash))throw new Error('Recovery transaction identities do not match the saved call');
  if(!record.replacementReason||record.replacementReason==='repriced') {
    if((record.request.to===null?transaction.to!==null:!same(transaction.to,record.request.to))||!same(transaction.input,record.request.data))throw new Error('Recovery transaction contents do not match the saved call');
  }
  if(receipt.blockNumber==null||head-receipt.blockNumber+1n<BigInt(confirmations(record)))throw new TransactionUnknownError(record,new Error('Waiting for confirmations'));
  checkOutcome(record,receipt);
  return receipt;
}
