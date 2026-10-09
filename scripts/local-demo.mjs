import ganache from 'ganache';
import {createServer} from 'node:http';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createPublicClient,createWalletClient,http,defineChain,keccak256,stringToHex,parseEventLogs} from 'viem';
import {compile} from './compile.mjs';

const rpc='http://127.0.0.1:8545';
const server=ganache.server({logging:{quiet:true},wallet:{totalAccounts:3},chain:{chainId:31337,hardfork:'shanghai'}});
await server.listen(8545,'127.0.0.1');
const chain=defineChain({id:31337,name:'Local EVM demo',nativeCurrency:{name:'Demo ETH',symbol:'ETH',decimals:18},rpcUrls:{default:{http:[rpc]}}});
const publicClient=createPublicClient({chain,transport:http(rpc)});
const accounts=await server.provider.request({method:'eth_accounts',params:[]});
const wallet=createWalletClient({account:accounts[0],chain,transport:http(rpc)});
const artifact=compile('shanghai');
const gas=await publicClient.estimateGas({account:accounts[0],data:artifact.bytecode});
const hash=await wallet.deployContract({abi:artifact.abi,bytecode:artifact.bytecode,gas});
const deployed=await publicClient.waitForTransactionReceipt({hash});
if(deployed.status!=='success')throw new Error('Local deployment reverted');
const address=deployed.contractAddress;
const args=[keccak256(stringToHex('Checklist agent v1'))];
const regGas=await publicClient.estimateContractGas({address,abi:artifact.abi,account:accounts[0],functionName:'registerAgent',args});
const reg=await wallet.writeContract({address,abi:artifact.abi,functionName:'registerAgent',args,gas:regGas});
const rr=await publicClient.waitForTransactionReceipt({hash:reg});
const agentId=parseEventLogs({abi:artifact.abi,logs:rr.logs,eventName:'AgentRegistered'})[0].args.agentId;
const config={mode:'local',chainId:31337,rpc,address,agentId,owner:accounts[0],reviewer:accounts[1],deploymentTx:hash,registrationTx:reg,startedAt:new Date().toISOString(),evmVersion:'shanghai'};
mkdirSync('evidence',{recursive:true});writeFileSync('evidence/local-chain.json',JSON.stringify(config,null,2));
const configServer=createServer((req,res)=>{
  const origin=req.headers.origin;
  const allowed=['http://127.0.0.1:5187','http://localhost:5187','http://127.0.0.1:4187','http://localhost:4187'];
  if(origin&&!allowed.includes(origin)){res.writeHead(403);res.end();return;}
  if(origin)res.setHeader('Access-Control-Allow-Origin',origin);
  res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');
  if(req.method==='GET'&&req.url==='/config'){res.end(JSON.stringify(config));}else{res.writeHead(404);res.end('{}');}
});
await new Promise(resolve=>configServer.listen(8546,'127.0.0.1',resolve));
console.log(`Local EVM ready, chain 31337. Registry ${address}. No Monad deployment has occurred. Run npm run dev.`);
async function stop(){configServer.close();await server.close();process.exit(0);}
process.on('SIGINT',stop);process.on('SIGTERM',stop);
