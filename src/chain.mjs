import {createPublicClient,createWalletClient,http,custom,defineChain,parseEventLogs,isAddress,keccak256,stringToHex,encodeFunctionData} from 'viem';
import {monadTestnet} from 'viem/chains';
import contract from './contract.json';
import {assertImplementation,requireActor,verifyAnchor} from './anchor.mjs';
import {trackTransaction,recoverTrackedTransaction,validateTransaction} from './transactions.mjs';

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
function requireResolved(connection){
  if(connection.pendingTransaction||connection.submissionInProgress)throw new Error('An unresolved transaction or signing request exists. Recover or finish it before another write.');
}
async function track(connection,submit,details,options){
  try {
    const receipt=await trackTransaction(connection.publicClient,submit,details,record=>{
      connection.pendingTransaction=record;
      options.onUpdate?.(record);
    });
    connection.pendingTransaction=null;return receipt;
  }catch(error){
    if(error.transaction&&['reverted','replaced'].includes(error.transaction.state))connection.pendingTransaction=null;
    throw error;
  }
}
async function applyDeployment(connection,receipt){
  if(!receipt.contractAddress)throw new Error('Confirmed deployment has no contract address');
  await assertImplementation(connection.publicClient,receipt.contractAddress,runtime(connection));
  connection.address=receipt.contractAddress;delete connection.agentId;
  return {chainId:10143,address:receipt.contractAddress,transactionHash:receipt.transactionHash,blockNumber:receipt.blockNumber.toString(),evmVersion:contract.evmVersion};
}
export async function deployMonad(connection,options={}){
  requireResolved(connection);
  connection.submissionInProgress=true;
  try{
  if(connection.mode!=='monad')throw new Error('Deployment requires Monad Testnet mode');
  const account=await requireActor(connection.signer(),10143,connection.owner);
  const gas=await connection.publicClient.estimateGas({account,data:contract.bytecode});
  const r=await track(connection,()=>connection.signer().deployContract({account,abi,bytecode:contract.bytecode,gas}),{kind:'deploy',chainId:10143,request:{from:account,to:null,data:contract.bytecode}},options);
  return applyDeployment(connection,r);
  }finally{connection.submissionInProgress=false;}
}
export async function transact(connection,actor,functionName,args,options={}){
  requireResolved(connection);
  connection.submissionInProgress=true;
  try{
  if(!connection.address)throw new Error('Enter a deployed registry address or deploy the registry first');
  const account=connection.mode==='local'?actor:await requireActor(connection.signer(),connection.chainId,actor);
  const c=connection.publicClient;
  if(await c.getChainId()!==connection.chainId)throw new Error('RPC chain has changed');
  await assertImplementation(c,connection.address,runtime(connection));
  const call={address:connection.address,abi,account,functionName,args};
  const {request}=await c.simulateContract(call);
  const gas=await c.estimateContractGas(call);
  return await track(connection,()=>connection.signer(account).writeContract({...request,account,gas}),{kind:functionName,chainId:connection.chainId,request:{from:account,to:connection.address,data:encodeFunctionData({abi,functionName,args})},context:options.context??{}},options);
  }finally{connection.submissionInProgress=false;}
}
export async function register(connection,options={}){
  const receipt=await transact(connection,connection.owner,'registerAgent',[keccak256(stringToHex('AgentProof checklist agent v1'))],options);
  connection.agentId=parseEventLogs({abi,logs:receipt.logs,eventName:'AgentRegistered'})[0].args.agentId;
  return receipt;
}
export function publishedId(receipt){return parseEventLogs({abi,logs:receipt.logs,eventName:'ReceiptPublished'})[0].args.receiptId;}
export async function readReceipt(connection,receiptId){return connection.publicClient.readContract({address:connection.address,abi,functionName:'getReceipt',args:[receiptId]});}

export async function recoveryConnection(input){
  const record=validateTransaction(input);
  if(record.chainId===31337){
    const c=await localConnection();
    if(c.address.toLowerCase()!==record.request.to?.toLowerCase())throw new Error('The disposable local chain was reset or its registry changed. This transaction cannot be recovered on the new chain.');
    return {...c,owner:null,signer:null};
  }
  // Deployment recovery has no registry address until its receipt is read.
  if(record.kind!=='deploy')return readOnlyMonadConnection(record.request.to);
  const publicClient=createPublicClient({chain:monadTestnet,transport:http('https://testnet-rpc.monad.xyz',{timeout:15000})});
  if(await publicClient.getChainId()!==10143)throw new Error('Wrong Monad RPC chain');
  return {mode:'monad',chainId:10143,address:null,owner:null,chain:monadTestnet,publicClient,signer:null};
}
export async function recoverChainTransaction(connection,input,options={}){
  const record=validateTransaction(input);
  if(connection.chainId!==record.chainId)throw new Error('Recovery network does not match the recorded transaction');
  if(record.kind!=='deploy'){
    if(connection.address?.toLowerCase()!==record.request.to.toLowerCase())throw new Error('Recovery registry does not match the recorded transaction');
    await assertImplementation(connection.publicClient,record.request.to,runtime(connection));
  }
  const receipt=await recoverTrackedTransaction(connection.publicClient,record,options.onUpdate);
  const result={receipt};
  if(record.kind==='deploy')result.deployment=await applyDeployment(connection,receipt);
  if(record.kind==='registerAgent'){
    const event=parseEventLogs({abi,logs:receipt.logs,eventName:'AgentRegistered'}).find(e=>e.args.owner.toLowerCase()===record.request.from.toLowerCase()&&e.address.toLowerCase()===record.request.to.toLowerCase());
    if(!event)throw new Error('Agent registration event does not match the recovered transaction');
    result.agentId=event.args.agentId;connection.agentId=event.args.agentId;
  }
  if(record.kind==='publishReceipt')result.receiptId=publishedId(receipt);
  connection.pendingTransaction=null;
  return result;
}
