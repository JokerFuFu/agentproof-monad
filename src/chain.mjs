import {createPublicClient,createWalletClient,http,custom,defineChain,parseEventLogs,isAddress,keccak256,stringToHex} from 'viem';
import {monadTestnet} from 'viem/chains';
import contract from './contract.json';
import {assertImplementation,requireActor,verifyAnchor} from './anchor.mjs';

export const abi=contract.abi;
export const STATUS=['Missing','Pending review','Accepted','Rejected','Revoked'];
const runtime=connection=>contract.runtimeBytecodes[connection.chainId===31337?'shanghai':'osaka'];
export const verifyChainAnchor=(connection,manifest,anchor)=>verifyAnchor(connection,manifest,anchor,abi,runtime(connection));
export async function localConnection(){
  if(!['127.0.0.1','localhost','[::1]'].includes(window.location.hostname))throw new Error('Use the localhost app for the local EVM demo. The public prototype does not access services on your device.');
  let res;try{res=await fetch('http://127.0.0.1:8546/config',{signal:AbortSignal.timeout(3000)});}catch{throw new Error('Local chain unavailable. Start npm run demo, then connect from http://127.0.0.1:5187/.');}
  if(!res.ok)throw new Error('Start the local chain with npm run demo');
  const config=await res.json();
  if(config.chainId!==31337||config.rpc!=='http://127.0.0.1:8545'||!isAddress(config.address))throw new Error('Invalid local demo configuration');
  const chain=defineChain({id:31337,name:'Local EVM demo',nativeCurrency:{name:'Demo ETH',symbol:'ETH',decimals:18},rpcUrls:{default:{http:[config.rpc]}}});
  const publicClient=createPublicClient({chain,transport:http(config.rpc)});
  if(await publicClient.getChainId()!==31337)throw new Error('Wrong local RPC chain');
  await assertImplementation(publicClient,config.address,contract.runtimeBytecodes.shanghai);
  const signer=account=>createWalletClient({account,chain,transport:http(config.rpc)});
  return {...config,chain,publicClient,signer};
}
export async function monadConnection(address){
  if(address&&!isAddress(address))throw new Error('Enter a valid registry address, or leave it empty to deploy a new registry');
  if(!window.ethereum)throw new Error('Open this app in a browser with an injected wallet. Add Monad Testnet yourself, then connect.');
  const wallet=createWalletClient({chain:monadTestnet,transport:custom(window.ethereum)});
  const [owner]=await wallet.requestAddresses();
  if(await wallet.getChainId()!==10143)throw new Error('Select Monad Testnet (10143) in your wallet, then connect again.');
  const publicClient=createPublicClient({chain:monadTestnet,transport:http('https://testnet-rpc.monad.xyz',{timeout:15000})});
  if(await publicClient.getChainId()!==10143)throw new Error('Wrong Monad RPC chain');
  if(isAddress(address))await assertImplementation(publicClient,address,contract.runtimeBytecodes.osaka);
  return {mode:'monad',chainId:10143,address:isAddress(address)?address:null,owner,chain:monadTestnet,publicClient,signer:()=>wallet};
}
export async function readOnlyMonadConnection(address){
  if(!isAddress(address))throw new Error('Enter the existing registry address to verify without a wallet');
  const publicClient=createPublicClient({chain:monadTestnet,transport:http('https://testnet-rpc.monad.xyz',{timeout:15000})});
  if(await publicClient.getChainId()!==10143)throw new Error('Wrong Monad RPC chain');
  await assertImplementation(publicClient,address,contract.runtimeBytecodes.osaka);
  return {mode:'monad',chainId:10143,address,owner:null,chain:monadTestnet,publicClient,signer:null};
}
export async function deployMonad(connection){
  if(connection.mode!=='monad')throw new Error('Deployment requires Monad Testnet mode');
  const account=await requireActor(connection.signer(),10143,connection.owner);
  const gas=await connection.publicClient.estimateGas({account,data:contract.bytecode});
  const hash=await connection.signer().deployContract({account,abi,bytecode:contract.bytecode,gas});
  const r=await connection.publicClient.waitForTransactionReceipt({hash,confirmations:2,timeout:90000});
  if(r.status!=='success'||!r.contractAddress)throw new Error('Monad deployment failed');
  connection.address=r.contractAddress;
  delete connection.agentId;
  await assertImplementation(connection.publicClient,r.contractAddress,runtime(connection));
  return {chainId:10143,address:r.contractAddress,transactionHash:hash,blockNumber:r.blockNumber.toString(),evmVersion:contract.evmVersion};
}
export async function transact(connection,actor,functionName,args){
  if(!connection.address)throw new Error('Enter a deployed registry address or deploy the registry first');
  const account=connection.mode==='local'?actor:await requireActor(connection.signer(),connection.chainId,actor);
  const c=connection.publicClient;
  if(await c.getChainId()!==connection.chainId)throw new Error('RPC chain has changed');
  await assertImplementation(c,connection.address,runtime(connection));
  const call={address:connection.address,abi,account,functionName,args};
  const {request}=await c.simulateContract(call);
  const gas=await c.estimateContractGas(call);
  const hash=await connection.signer(account).writeContract({...request,account,gas});
  const receipt=await c.waitForTransactionReceipt({hash,confirmations:connection.mode==='monad'?2:1,timeout:90000});
  if(receipt.status!=='success')throw new Error('Transaction reverted');
  return receipt;
}
export async function register(connection){
  const receipt=await transact(connection,connection.owner,'registerAgent',[keccak256(stringToHex('AgentProof checklist agent v1'))]);
  connection.agentId=parseEventLogs({abi,logs:receipt.logs,eventName:'AgentRegistered'})[0].args.agentId;
  return receipt;
}
export function publishedId(receipt){return parseEventLogs({abi,logs:receipt.logs,eventName:'ReceiptPublished'})[0].args.receiptId;}
export async function readReceipt(connection,receiptId){return connection.publicClient.readContract({address:connection.address,abi,functionName:'getReceipt',args:[receiptId]});}
