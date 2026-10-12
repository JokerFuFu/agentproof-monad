import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import artifact from '../src/contract.json' with {type:'json'};

const bundle=await build({entryPoints:[new URL('../src/chain.mjs',import.meta.url).pathname],bundle:true,format:'esm',platform:'node',write:false});
const bundleDir=await mkdtemp(join(tmpdir(),'agentproof-connection-test-'));
const bundlePath=join(bundleDir,'chain.mjs');await writeFile(bundlePath,bundle.outputFiles[0].text);
after(()=>rm(bundleDir,{recursive:true,force:true}));
const {deployMonad,localConnection,readOnlyMonadConnection,transact}=await import(pathToFileURL(bundlePath).href);
test('new deployment clears an agent ID cached from a different registry',async()=>{
  // A unit-test wallet/receipt boundary, not a real Monad transaction.
  const owner='0x'+'11'.repeat(20),address='0x'+'22'.repeat(20);
  const wallet={getChainId:async()=>10143,getAddresses:async()=>[owner],deployContract:async()=> '0x'+'33'.repeat(32)};
  const connection={mode:'monad',owner,address:'0x'+'44'.repeat(20),agentId:'0x'+'55'.repeat(32),signer:()=>wallet,publicClient:{estimateGas:async()=>1000000n,waitForTransactionReceipt:async()=>({status:'success',contractAddress:address,blockNumber:1n}),getBytecode:async()=>artifact.runtimeBytecodes.osaka}};
  await deployMonad(connection);
  assert.equal(connection.address,address);
  assert.equal(connection.agentId,undefined);
});
test('the real local-connection implementation blocks a public page before any local request',async t=>{
  const oldWindow=globalThis.window,oldFetch=globalThis.fetch;let requests=0;
  globalThis.window={location:{hostname:'jokerfufu.github.io'}};
  globalThis.fetch=async()=>{requests++;throw new Error('Unexpected request');};
  t.after(()=>{globalThis.window=oldWindow;globalThis.fetch=oldFetch;});
  await assert.rejects(localConnection(),/localhost.*public prototype/i);
  assert.equal(requests,0);
});
test('the real read-only connection checks chain and implementation without accessing a wallet',async t=>{
  const oldWindow=globalThis.window,oldFetch=globalThis.fetch,methods=[];
  globalThis.window={get ethereum(){throw new Error('Read-only verification accessed a wallet');}};
  globalThis.fetch=async(url,init)=>{
    assert.equal(new URL(url).origin,'https://testnet-rpc.monad.xyz');const request=JSON.parse(init.body);methods.push(request.method);
    const result=request.method==='eth_chainId'?'0x279f':request.method==='eth_getCode'?artifact.runtimeBytecodes.osaka:undefined;
    assert.notEqual(result,undefined);
    return new Response(JSON.stringify({jsonrpc:'2.0',id:request.id,result}),{headers:{'Content-Type':'application/json'}});
  };
  t.after(()=>{globalThis.window=oldWindow;globalThis.fetch=oldFetch;});
  const connection=await readOnlyMonadConnection('0x'+'22'.repeat(20));
  assert.equal(connection.chainId,10143);assert.equal(connection.owner,null);assert.equal(connection.signer,null);
  assert.deepEqual(methods,['eth_chainId','eth_getCode']);
});

function writeBoundary(wait) {
  const owner='0x'+'11'.repeat(20),address='0x'+'22'.repeat(20),hash='0x'+'33'.repeat(32);
  let submissions=0;
  const wallet={getChainId:async()=>10143,getAddresses:async()=>[owner],writeContract:async()=>{submissions++;return hash;},deployContract:async()=>{submissions++;return hash;}};
  const connection={mode:'monad',chainId:10143,owner,address,signer:()=>wallet,publicClient:{getChainId:async()=>10143,getBytecode:async()=>artifact.runtimeBytecodes.osaka,simulateContract:async call=>({request:call}),estimateContractGas:async()=>100000n,estimateGas:async()=>1000000n,waitForTransactionReceipt:wait}};
  return {connection,owner,address,hash,submissions:()=>submissions};
}
test('publication hash reaches the recovery boundary before waiting for confirmations',async()=>{
  const updates=[];
  const boundary=writeBoundary(async({hash})=>{
    assert.equal(updates[0]?.hash,hash,'Broadcast hash must be saved before waiting');
    assert.equal(updates[0]?.state,'broadcast');
    return {transactionHash:hash,status:'success',blockNumber:10n};
  });
  await transact(boundary.connection,boundary.owner,'registerAgent',['0x'+'44'.repeat(32)],{onUpdate:update=>updates.push(update)});
  assert.equal(updates.at(-1).state,'confirmed');
  assert.equal(boundary.submissions(),1);
});
test('a timeout preserves the same hash and prevents a second broadcast on that connection',async()=>{
  const updates=[];
  const boundary=writeBoundary(async()=>{throw new Error('Receipt wait timed out');});
  const send=()=>transact(boundary.connection,boundary.owner,'registerAgent',['0x'+'44'.repeat(32)],{onUpdate:update=>updates.push(update)});
  await assert.rejects(send(),error=>{
    assert.equal(error.transaction?.hash,boundary.hash);
    assert.equal(error.transaction?.state,'unknown');
    return /unknown/i.test(error.message);
  });
  assert.equal(updates.at(-1).state,'unknown');
  await assert.rejects(send(),/recover|unresolved/i);
  assert.equal(boundary.submissions(),1);
});
test('deployment also saves a broadcast hash before an RPC failure and cannot be repeated',async()=>{
  const updates=[];
  const boundary=writeBoundary(async()=>{throw new Error('RPC unavailable');});
  await assert.rejects(deployMonad(boundary.connection,{onUpdate:update=>updates.push(update)}),error=>error.transaction?.hash===boundary.hash);
  assert.equal(updates[0]?.state,'broadcast');
  await assert.rejects(deployMonad(boundary.connection),/recover|unresolved/i);
  assert.equal(boundary.submissions(),1);
});
