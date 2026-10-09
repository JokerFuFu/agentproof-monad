import {isAddress, parseEventLogs, keccak256, encodeAbiParameters} from 'viem';

const hash = value => typeof value === 'string' && /^0x[0-9a-f]{64}$/i.test(value);
const same = (a,b) => typeof a === 'string' && typeof b === 'string' && a.toLowerCase() === b.toLowerCase();

// Imported identities and status are hints only. Keep only lookup coordinates.
export function validateAnchor(anchor) {
  if (!anchor || ![31337,10143].includes(anchor.chainId)) throw new Error('Unsupported proof network / chain');
  if (!isAddress(anchor.address)) throw new Error('Invalid registry address');
  if (!hash(anchor.receiptId) || !hash(anchor.publishTx)) throw new Error('Invalid receipt or publication transaction');
  return {chainId:anchor.chainId,address:anchor.address,receiptId:anchor.receiptId,publishTx:anchor.publishTx,verified:false};
}

export async function requireActor(wallet, chainId, expected) {
  if (await wallet.getChainId() !== chainId) throw new Error(`Select chain ${chainId} in your wallet`);
  const [current] = await wallet.getAddresses();
  if (!isAddress(current) || !same(current,expected)) throw new Error(`Switch wallet to the required account: ${expected}`);
  return current;
}

export async function assertImplementation(client, address, expectedRuntime) {
  const code = await client.getBytecode({address});
  if (!expectedRuntime || !same(code,expectedRuntime)) throw new Error('Registry implementation does not match this AgentProof version');
}

export async function verifyAnchor(connection, manifest, imported, abi, expectedRuntime) {
  const anchor = validateAnchor(imported);
  const client = connection.publicClient;
  if (connection.chainId !== anchor.chainId || !same(connection.address,anchor.address) || await client.getChainId() !== anchor.chainId) {
    throw new Error('Connect to the proof package network and registry before verification');
  }
  await assertImplementation(client,anchor.address,expectedRuntime);
  const publication = await client.getTransactionReceipt({hash:anchor.publishTx});
  if (publication.status !== 'success' || !same(publication.to,anchor.address)) throw new Error('Invalid publication transaction');
  const logs = publication.logs.filter(log => same(log.address,anchor.address));
  const event = parseEventLogs({abi,logs,eventName:'ReceiptPublished'}).find(e=>same(e.args.receiptId,anchor.receiptId));
  if (!event) throw new Error('Receipt publication event not found in transaction');
  const r = await client.readContract({address:anchor.address,abi,functionName:'getReceipt',args:[anchor.receiptId]});
  const [owner] = await client.readContract({address:anchor.address,abi,functionName:'agents',args:[r.agentId]});
  const derived = keccak256(encodeAbiParameters([{type:'uint256'},{type:'address'},{type:'bytes32'},{type:'bytes32'}],[BigInt(anchor.chainId),anchor.address,r.agentId,r.taskId]));
  if (!same(derived,anchor.receiptId) || !same(publication.from,owner) || !same(event.args.agentId,r.agentId) || !same(event.args.taskId,r.taskId) || !same(event.args.reviewer,r.reviewer) || !same(event.args.outputHash,r.outputHash)) {
    throw new Error('Receipt identities do not match the publication');
  }
  if (!same(r.taskId,manifest.taskId) || !same(r.inputHash,manifest.commitments.input) || !same(r.outputHash,manifest.commitments.output) || !same(r.policyHash,manifest.commitments.policy) || Number(r.status) === 0) {
    throw new Error('Live receipt commitments differ from the proof package');
  }
  return {...anchor,verified:true,agentId:r.agentId,owner,reviewer:r.reviewer,blockNumber:publication.blockNumber.toString(),expiresAt:r.expiresAt.toString(),status:Number(r.status),reviewEvidenceHash:r.reviewEvidenceHash};
}
