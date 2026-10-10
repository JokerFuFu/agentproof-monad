import {readFileSync} from 'node:fs';
import {createPublicClient,http} from 'viem';
import {verifyManifest} from '../src/proof.mjs';
import {verifyAnchor} from '../src/anchor.mjs';

const path=process.argv[2]||'public/agentproof-monad-proof.json';
const proof=JSON.parse(readFileSync(path,'utf8'));
const artifact=JSON.parse(readFileSync(new URL('../src/contract.json',import.meta.url),'utf8'));
if(proof.anchor?.chainId!==10143)throw new Error('Expected a Monad Testnet proof package');
const original=verifyManifest(proof.manifest,proof.manifest?.output);
if(!original.valid)throw new Error(original.reason);
const publicClient=createPublicClient({transport:http('https://testnet-rpc.monad.xyz',{timeout:15000,retryCount:0})});
const anchor=await verifyAnchor({publicClient,chainId:10143,address:proof.anchor.address},proof.manifest,proof.anchor,artifact.abi,artifact.runtimeBytecodes.osaka);
const tamper=verifyManifest(proof.manifest,proof.manifest.output+'\nChanged after delivery.');
if(tamper.valid)throw new Error('Changed delivery unexpectedly passed integrity verification');
console.log(JSON.stringify({checkedAt:new Date().toISOString(),manifestVerified:true,tamperRejected:true,liveAnchor:anchor},null,2));
