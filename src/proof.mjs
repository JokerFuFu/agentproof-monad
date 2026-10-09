import { sha256, stringToHex } from 'viem';

export const POLICY = 'agentproof/checklist-v1: detect explicit deadline, timezone, demo, code link and write-up; report exact source snippets; mark absent fields as missing; do not infer eligibility.';
export const SAMPLE = `Synthetic event brief — not official rules\nSubmission deadline: 2026-10-13.\nRequired deliverables: a working demo, code link, and short write-up.\nIndividuals or teams can participate.\nThe exact cutoff time and timezone are not specified in this brief.`;

export function artifactHash(text, salt, kind) {
  if (typeof text !== 'string') throw new Error('Artifact must be text');
  if (!/^[0-9a-f]{64}$/i.test(salt)) throw new Error('Use a 256-bit hex salt');
  if (!['input','output','policy','metadata','review'].includes(kind)) throw new Error('Unknown artifact kind');
  return sha256(stringToHex(`AgentProof/artifact/v1\0${kind}\0${salt.toLowerCase()}\0${text}`));
}
export function randomHex() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2,'0')).join('');
}
export function runAgent(input) {
  if (typeof input !== 'string' || !input.trim()) throw new Error('Input is required');
  const rules = [
    ['deadline','Submission date',/\b\d{4}-\d{2}-\d{2}\b/],
    ['timezone','Explicit cutoff timezone',/\b(?:UTC|GMT)(?:[+-]\d{1,2})?\b|\b(?:America|Europe|Asia)\/[A-Za-z_]+/],
    ['demo','Working demo',/\b(?:working\s+)?demo\b/i],
    ['code','Code link',/\bcode\s+link\b|\brepositor(?:y|ies)\b/i],
    ['writeup','Short write-up',/\bwrite[- ]?up\b/i],
  ];
  return {agent:'Checklist agent v1 (deterministic, no LLM)',checks:rules.map(([id,label,re])=>{
    const m = input.match(re);
    return {id,label,status:m?'found':'missing',evidence:m?m[0]:null};
  }),note:'Presence checks only. This report does not establish eligibility or factual correctness.'};
}
export function createManifest(input, salt = randomHex(), taskId = '0x'+randomHex()) {
  if (!/^0x[0-9a-f]{64}$/i.test(taskId)) throw new Error('Invalid task ID');
  const output = JSON.stringify(runAgent(input),null,2);
  return {version:'agentproof/1',taskId,salt,input,output,policy:POLICY,
    commitments:{input:artifactHash(input,salt,'input'),output:artifactHash(output,salt,'output'),policy:artifactHash(POLICY,salt,'policy')}};
}
export function verifyManifest(manifest, output = manifest?.output) {
  try {
    if (manifest?.version !== 'agentproof/1' || !/^0x[0-9a-f]{64}$/i.test(manifest.taskId)) throw new Error('Unsupported or malformed proof package');
    for (const kind of ['input','policy','output']) {
      const content = kind === 'output' ? output : manifest[kind];
      const computed = artifactHash(content,manifest.salt,kind);
      if (computed !== manifest.commitments?.[kind]) return {valid:false,reason:kind[0].toUpperCase()+kind.slice(1)+' commitment mismatch',computed};
    }
    return {valid:true,reason:'All artifact commitments match',computed:manifest.commitments.output};
  } catch(e) { return {valid:false,reason:e.message}; }
}
