import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import ganache from 'ganache';
import {createPublicClient, createWalletClient, custom, keccak256, stringToHex, parseEventLogs, zeroHash, zeroAddress, decodeErrorResult} from 'viem';
import {compile} from '../scripts/compile.mjs';

let provider, publicClient, wallets, addresses, artifact, address;
const h = text => keccak256(stringToHex(text));
before(async()=>{
  artifact = compile('shanghai');
  provider = ganache.provider({logging:{quiet:true},wallet:{totalAccounts:4},chain:{hardfork:'shanghai'}});
  addresses = await provider.request({method:'eth_accounts',params:[]});
  publicClient = createPublicClient({transport:custom(provider)});
  wallets = addresses.map(account=>createWalletClient({account,transport:custom(provider)}));
  const gas = await publicClient.estimateGas({account:addresses[0],data:artifact.bytecode});
  const tx = await wallets[0].deployContract({abi:artifact.abi,bytecode:artifact.bytecode,chain:null,gas});
  address = (await publicClient.waitForTransactionReceipt({hash:tx})).contractAddress;
});
after(async()=>{await provider?.disconnect();});
async function write(i,name,args){
  let request;
  try { ({request} = await publicClient.simulateContract({address,abi:artifact.abi,account:addresses[i],functionName:name,args})); }
  catch(e) {
    // Ganache uses -32000 for reverts; preserve and decode the actual EVM revert data.
    const revert=e.walk?.(cause=>typeof cause.data==='string' && cause.data.startsWith('0x'));
    if(revert?.data) throw new Error(decodeErrorResult({abi:artifact.abi,data:revert.data}).errorName,{cause:e});
    throw e;
  }
  const gas = await publicClient.estimateContractGas({address,abi:artifact.abi,account:addresses[i],functionName:name,args});
  const tx = await wallets[i].writeContract({...request,chain:null,gas});
  const result = await publicClient.waitForTransactionReceipt({hash:tx});
  assert.equal(result.status,'success'); return result;
}
async function agent(i=0){const r=await write(i,'registerAgent',[h('metadata')]);return parseEventLogs({abi:artifact.abi,logs:r.logs,eventName:'AgentRegistered'})[0].args.agentId;}
async function publish(id, task, reviewer=addresses[1], seconds=3600, i=0){
  const b=await publicClient.getBlock();
  const r=await write(i,'publishReceipt',[id,h(task),h('input'),h('output'),h('policy'),reviewer,b.timestamp+BigInt(seconds)]);
  return parseEventLogs({abi:artifact.abi,logs:r.logs,eventName:'ReceiptPublished'})[0].args.receiptId;
}
const read = id => publicClient.readContract({address,abi:artifact.abi,functionName:'getReceipt',args:[id]});
test('only registered agent owner can publish and task receipts cannot be overwritten',async()=>{
  const id=await agent(); await publish(id,'unique');
  await assert.rejects(publish(id,'unauthorized',addresses[1],3600,2),/NotAgentOwner/);
  await assert.rejects(publish(id,'unique'),/DuplicateReceipt/);
  await assert.rejects(publish(h('unknown'),'x'),/NotAgentOwner/);
});
test('designated reviewer is enforced and owner cannot manufacture acceptance',async()=>{
  const id=await agent(); const rid=await publish(id,'review');
  await assert.rejects(write(2,'reviewReceipt',[rid,true,h('evidence')]),/NotReviewer/);
  await assert.rejects(write(0,'reviewReceipt',[rid,true,h('evidence')]),/NotReviewer/);
  await write(1,'reviewReceipt',[rid,true,h('evidence')]);
  const r=await read(rid); assert.equal(r.status,2); assert.equal(r.outputHash,h('output'));
  await assert.rejects(write(1,'reviewReceipt',[rid,false,h('other')]),/NotPending/);
});
test('owner revocation invalidates an accepted receipt without altering commitments',async()=>{
  const id=await agent();const rid=await publish(id,'revoke');
  await write(1,'reviewReceipt',[rid,true,h('evidence')]);
  await assert.rejects(write(2,'revokeReceipt',[rid]),/NotAgentOwner/);
  await write(0,'revokeReceipt',[rid]);
  const r=await read(rid); assert.equal(r.status,4); assert.equal(r.outputHash,h('output'));
  await assert.rejects(write(1,'reviewReceipt',[rid,true,h('evidence')]),/NotPending/);
});
test('empty commitments, self-review, zero reviewer and invalid expiry are rejected',async()=>{
  const id=await agent(); const b=await publicClient.getBlock();
  await assert.rejects(write(0,'registerAgent',[zeroHash]),/InvalidCommitment/);
  for (const reviewer of [zeroAddress,addresses[0]]) await assert.rejects(publish(id,'self',reviewer),/InvalidReviewer/);
  await assert.rejects(write(0,'publishReceipt',[id,h('zero'),zeroHash,h('o'),h('p'),addresses[1],b.timestamp+3600n]),/InvalidCommitment/);
  await assert.rejects(publish(id,'past',addresses[1],-1),/InvalidExpiry/);
  const rid=await publish(id,'blankreview');
  await assert.rejects(write(1,'reviewReceipt',[rid,true,zeroHash]),/InvalidCommitment/);
});
test('late review fails, reviewer can reject and nonexistent receipts cannot be revoked',async()=>{
  const id=await agent();const rid=await publish(id,'expires',addresses[1],30);
  await provider.request({method:'evm_increaseTime',params:[40]}); await provider.request({method:'evm_mine',params:[]});
  await assert.rejects(write(1,'reviewReceipt',[rid,true,h('evidence')]),/ReceiptExpired/);
  const rejected=await publish(id,'reject');await write(1,'reviewReceipt',[rejected,false,h('reason')]);
  assert.equal((await read(rejected)).status,3);
  await assert.rejects(write(0,'revokeReceipt',[h('absent')]),/NotAgentOwner/);
});
