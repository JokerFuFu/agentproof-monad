import {test} from 'node:test';
import assert from 'node:assert/strict';
import ganache from 'ganache';
import solc from 'solc';
import {createPublicClient,createWalletClient,custom,keccak256,stringToHex,parseEventLogs} from 'viem';
import {compile} from '../scripts/compile.mjs';
import {validateAnchor,verifyAnchor,requireActor} from '../src/anchor.mjs';
import {createManifest} from '../src/proof.mjs';
test('imported anchors never qualify unsupported chains or malformed transactions',()=>{
  assert.throws(()=>validateAnchor({chainId:143}),/network|chain/i);
  assert.throws(()=>validateAnchor({chainId:10143,address:'fake'}),/address/i);
});
test('wallet writes use the actual connected account and reject the wrong role',async()=>{
  const owner='0x'+'11'.repeat(20),reviewer='0x'+'22'.repeat(20);
  const wallet={getChainId:async()=>10143,getAddresses:async()=>[reviewer]};
  assert.equal(await requireActor(wallet,10143,reviewer),reviewer);
  await assert.rejects(requireActor(wallet,10143,owner),/Switch.*wallet/i);
  await assert.rejects(requireActor({...wallet,getChainId:async()=>143},10143,reviewer),/chain/i);
});
test('verification reconstructs identities and rejects fabricated publication and implementation',async()=>{
  const p=ganache.provider({logging:{quiet:true},chain:{chainId:31337,hardfork:'shanghai'}});
  try{
    const addresses=await p.request({method:'eth_accounts',params:[]});const client=createPublicClient({transport:custom(p)});
    const wallet=createWalletClient({account:addresses[0],transport:custom(p)}),artifact=compile('shanghai');
    const deploy=async a=>{const gas=await client.estimateGas({account:addresses[0],data:a.bytecode});const hash=await wallet.deployContract({abi:a.abi,bytecode:a.bytecode,gas,chain:null});return (await client.waitForTransactionReceipt({hash})).contractAddress;};
    const address=await deploy(artifact);
    const write=async(name,args)=>{const gas=await client.estimateContractGas({address,abi:artifact.abi,account:addresses[0],functionName:name,args});const hash=await wallet.writeContract({address,abi:artifact.abi,functionName:name,args,gas,chain:null});return client.waitForTransactionReceipt({hash});};
    const ar=await write('registerAgent',[keccak256(stringToHex('agent'))]);const agentId=parseEventLogs({abi:artifact.abi,logs:ar.logs,eventName:'AgentRegistered'})[0].args.agentId;
    const m=createManifest('A demo and code link.','11'.repeat(32));const b=await client.getBlock();const c=m.commitments;
    const rr=await write('publishReceipt',[agentId,m.taskId,c.input,c.output,c.policy,addresses[1],b.timestamp+1000n]);const rid=parseEventLogs({abi:artifact.abi,logs:rr.logs,eventName:'ReceiptPublished'})[0].args.receiptId;
    const anchor={chainId:31337,address,receiptId:rid,publishTx:rr.transactionHash,owner:addresses[9],reviewer:addresses[9],blockNumber:'999999',status:2};
    const fresh=await verifyAnchor({chainId:31337,address,publicClient:client},m,anchor,artifact.abi,artifact.runtimeBytecode);
    assert.equal(fresh.owner.toLowerCase(),addresses[0]);assert.equal(fresh.reviewer.toLowerCase(),addresses[1]);assert.equal(fresh.status,1);assert.equal(fresh.blockNumber,rr.blockNumber.toString());assert.equal(fresh.verified,true);
    await assert.rejects(verifyAnchor({chainId:31337,address,publicClient:client},m,{...anchor,publishTx:ar.transactionHash},artifact.abi,artifact.runtimeBytecode),/publication/i);
    await assert.rejects(verifyAnchor({chainId:31337,address,publicClient:client},m,{...anchor,receiptId:'0x'+'11'.repeat(32)},artifact.abi,artifact.runtimeBytecode),/receipt|publication/i);
    const fakeInput={language:'Solidity',sources:{'F.sol':{content:'pragma solidity ^0.8.30; contract F { function getReceipt(bytes32) external pure returns(uint256){return 2;} }'}},settings:{evmVersion:'shanghai',outputSelection:{'*':{'*':['abi','evm.bytecode.object']}}}};
    const fake=JSON.parse(solc.compile(JSON.stringify(fakeInput))).contracts['F.sol'].F;
    const fakeAddress=await deploy({abi:fake.abi,bytecode:'0x'+fake.evm.bytecode.object});
    await assert.rejects(verifyAnchor({chainId:31337,address:fakeAddress,publicClient:client},m,{...anchor,address:fakeAddress},artifact.abi,artifact.runtimeBytecode),/implementation/i);
  }finally{await p.disconnect();}
});
