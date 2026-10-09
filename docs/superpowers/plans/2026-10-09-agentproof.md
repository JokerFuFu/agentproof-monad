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

- [x] Proof engine: create `tests/proof.test.mjs`, run `npm test` to establish missing-feature failure, implement `src/proof.mjs` with `artifactHash(text, salt, kind)`, `runAgent(text)`, `createManifest(input, salt, taskId)`, `verifyManifest(manifest, output)`; run tests.
- [x] Contract: create `tests/registry.test.mjs`, compile absent source to establish failure, implement `contracts/AgentProofRegistry.sol`; compile with `scripts/compile.mjs`; test real permissions, duplicates, expiry and statuses. `publishReceipt(agentId, taskId, inputHash, outputHash, policyHash, reviewer, expiresAt)` returns receipt ID. `reviewReceipt(receiptId, accepted, evidenceHash)` is designated-reviewer only.
- [x] Local demo: `scripts/local-demo.mjs` starts loopback RPC, deploys compiled Shanghai artifact, returns only public config through `/config`; local disposable accounts are isolated. `npm run demo` plus `npm run dev` makes the workbench available.
- [x] UI: `index.html`, `src/main.js`, `src/chain.mjs`, `src/style.css`; run workflow, publish, verify, tamper, accept, revoke, export. Monad configuration from `viem/chains`; check chain IDs before external writes and wait for successful receipts.
- [x] Evidence and materials: `scripts/check-monad.mjs` read-only probes chain ID and latest block; `docs/submission/*` records rules and drafts; README explains limits and exact commands.
- [x] Local acceptance: run tests/build, exercise the real local UI including real file import, capture chain evidence, self-review permissions and UX. Record all external blockers and requests together. This does not include external Monad deployment or public release.

## Observed status

12 tests pass; production build succeeds; independent review and browser publication/tamper/accept/export/import/revocation paths pass. The compiled site's project-subpath asset smoke check passes. Monad RPC is reachable on chain 10143; deployment/signatures, public source/hosting/video and final entry remain gated. The approved profile, solo team and AgentProof project are created. Later description/strategy save confirmation and logo upload require restored browser control.
