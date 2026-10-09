# AgentProof Implementation Plan

**Goal:** Reproducible provenance and designated-reviewer receipt demo ready for Monad Testnet deployment.
**Architecture:** Local hashing/checking, immutable Solidity receipts, real local EVM for testing, injected-wallet Testnet writes.
**Tech stack:** Node 22.13+, Vite, viem, Solidity, solc, Ganache (local tests only).

## Constraints

- Independent project and new work starting 2026-10-09.
- Only synthetic demo documents; no user credentials or real funds.
- Local EVM and Monad Testnet labeled separately.
- Never infer AI correctness from matching hashes or fabricate deployment evidence.
- Public release and final submission are gated on specific authorization.

## Tasks

- [ ] Proof engine: create `tests/proof.test.mjs`, run `npm test` to establish missing-feature failure, implement `src/proof.mjs` with `artifactHash(text, salt, kind)`, `runAgent(text)`, `createManifest(input, salt, taskId)`, `verifyManifest(manifest, output)`; run tests.
- [ ] Contract: create `tests/registry.test.mjs`, compile absent source to establish failure, implement `contracts/AgentProofRegistry.sol`; compile with `scripts/compile.mjs`; test real permissions, duplicates, expiry and statuses. `publishReceipt(agentId, taskId, inputHash, outputHash, policyHash, reviewer, expiresAt)` returns receipt ID. `reviewReceipt(receiptId, accepted, evidenceHash)` is designated-reviewer only.
- [ ] Local demo: `scripts/local-demo.mjs` starts loopback RPC, deploys compiled Shanghai artifact, returns only public config through `/config`; local disposable accounts are isolated. `npm run demo` plus `npm run dev` makes the workbench available.
- [ ] UI: `index.html`, `src/main.js`, `src/chain.mjs`, `src/style.css`; run workflow, publish, verify, tamper, accept, revoke, export. Monad configuration from `viem/chains`; check chain IDs before external writes and wait for successful receipts.
- [ ] Evidence and materials: `scripts/check-monad.mjs` read-only probes chain ID and latest block; `docs/submission/*` records rules and drafts; README explains limits and exact commands.
- [ ] Acceptance: run tests/build, exercise the real local UI, capture chain evidence, self-review permissions and UX. Record all external blockers and requests together.
