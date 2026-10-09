import {writeFileSync,mkdirSync} from 'node:fs';

const endpoint='https://testnet-rpc.monad.xyz';
async function rpc(method,params=[]){
  const response=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw new Error(`RPC HTTP ${response.status}`);
  const body=await response.json();if(body.error)throw new Error(body.error.message);return body.result;
}
const evidence={checkedAt:new Date().toISOString(),endpoint,readOnly:true,contractDeployed:false};
try{
  evidence.chainId=Number(BigInt(await rpc('eth_chainId')));
  if(evidence.chainId!==10143)throw new Error(`Expected Monad Testnet 10143, got ${evidence.chainId}`);
  const block=await rpc('eth_getBlockByNumber',['latest',false]);
  evidence.blockNumber=BigInt(block.number).toString();evidence.blockHash=block.hash;evidence.blockTimestamp=new Date(Number(BigInt(block.timestamp))*1000).toISOString();evidence.status='reachable';
}catch(error){evidence.status='unavailable';evidence.error=error.message;process.exitCode=1;}
mkdirSync('evidence',{recursive:true});writeFileSync('evidence/monad-rpc.json',JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence,null,2));
