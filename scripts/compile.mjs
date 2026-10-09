import solc from 'solc';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

export function compile(evmVersion='osaka') {
  const source=readFileSync(new URL('../contracts/AgentProofRegistry.sol',import.meta.url),'utf8');
  const input={language:'Solidity',sources:{'AgentProofRegistry.sol':{content:source}},settings:{evmVersion,optimizer:{enabled:true,runs:200},outputSelection:{'*':{'*':['abi','evm.bytecode.object','evm.deployedBytecode.object']}}}};
  const output=JSON.parse(solc.compile(JSON.stringify(input)));
  const errors=(output.errors??[]).filter(e=>e.severity==='error');
  if(errors.length) throw new Error(errors.map(e=>e.formattedMessage).join('\n'));
  const c=output.contracts['AgentProofRegistry.sol'].AgentProofRegistry;
  return {contractName:'AgentProofRegistry',compiler:solc.version(),evmVersion,abi:c.abi,bytecode:'0x'+c.evm.bytecode.object,runtimeBytecode:'0x'+c.evm.deployedBytecode.object,input};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  mkdirSync('artifacts',{recursive:true});
  const compiled={};
  for(const target of ['osaka','shanghai']){
    const artifact=compile(target);writeFileSync(`artifacts/registry-${target}.json`,JSON.stringify(artifact,null,2));
    compiled[target]=artifact;
    console.log(`Compiled ${target}: ${(artifact.bytecode.length-2)/2} bytes`);
  }
  writeFileSync('src/contract.json',JSON.stringify({abi:compiled.osaka.abi,bytecode:compiled.osaka.bytecode,evmVersion:'osaka',runtimeBytecodes:{osaka:compiled.osaka.runtimeBytecode,shanghai:compiled.shanghai.runtimeBytecode}},null,2));
}
