# AgentProof

Portable receipts for agent deliveries, with immutable commitments and a designated reviewer's decision. New independent work started on **9 October 2026** for Metropolis, Trust, Identity & AI Infrastructure.

## Run the working local demo

Use Node 22.13 or newer. Node 26 is tested; Ganache falls back to its JavaScript implementation when its optional native bindings are unavailable.

```sh
npm ci --ignore-scripts
npm test
npm run build
```

In two terminals:

```sh
npm run demo
```

```sh
npm run dev
```

Open <http://127.0.0.1:5187/>. Connect the local demo, run the checking agent, publish, verify, try a tampered delivery, restore, accept as reviewer, verify again, then revoke. The RPC and configuration service bind only to loopback ports 8545 and 8546. Restarting `npm run demo` creates a new disposable chain and invalidates old local receipt coordinates. No customer documents or external model API are needed.

## What is verified

The sample agent is a **deterministic checklist, without an LLM**. It flags explicit dates, timezones and deliverable keywords in a synthetic brief. Its missing-field behavior gives the reviewer something concrete to inspect. The receipt protocol works with other agents' text artifacts as well.

The browser hashes the exact input, output and policy using domain-separated SHA-256 with a random 256-bit salt. A wallet-owned registry records those commitments, the publisher's agent ID, designated reviewer and review deadline. The reviewer can accept or reject once; the publisher can revoke. The publisher cannot self-review. Raw documents and salts stay in the local proof package, whose contents are revealed to anyone given that package.

Live verification checks the chain ID, exact registry runtime bytecode, successful publication transaction, event, derived receipt ID, owner, reviewer and current commitments/status. Imported JSON does not establish a confirmed deployment or trustworthy identity. Editing content clears previous verification feedback.

Matching commitments prove integrity and association with the publisher's transaction. They do **not** prove factual accuracy, useful output, correct AI execution or that the reviewer is an independent person. Two different wallets can belong to the same person. Rejected receipts can still have intact artifacts; revoked receipts are invalid. Agent IDs are scoped to this registry, not ERC-8004 identities. There is no payment, marketplace, reputation score or production audit.

## Monad Testnet

The browser includes a wallet deployment/publication/review path for [Monad Testnet](https://docs.monad.xyz/developer-essentials/testnet), chain **10143**, using `https://testnet-rpc.monad.xyz`. The deployment artifact targets **Osaka**; the isolated Ganache demo targets Shanghai. Both are compiled from the same Solidity source with solc 0.8.30 and optimizer 200.

Read-only connectivity check:

```sh
npm run check:monad
```

This writes `evidence/monad-rpc.json`. A successful RPC check is **not deployment evidence**. No AgentProof contract has yet been deployed on Monad. To deploy, the user must use a test-only injected wallet, select chain 10143, connect, approve the deployment and agent-registration/publication transactions, then switch to the designated review wallet. Every external write checks the actual account and network before simulation and signing. The app never requests a private key. Use only test MON from the [official faucet](https://faucet.monad.xyz/); no real funds are required by this demo.

The deployment button exports network/address/transaction evidence after two confirmations. The proof package includes the publication transaction. Verify these live and retain the explorer links before claiming Monad integration in a submission. Public hosting also needs approval and a smoke test; local services are not available to judges.

## Tests and materials

`npm test` runs 12 tests against the proof engine and real compiled contract bytecode: content changes, malformed packages, permissions, duplicate receipts, self-review, expiry, terminal review, revocation, fake registry implementations and publication transactions, reconstructed identities, and actual wallet account selection. `npm run build` compiles both targets and builds the web app. The browser acceptance flow is recorded in `docs/submission/validation.md`.

- [Submission draft](docs/submission/project.md)
- [Three-minute demo script](docs/submission/demo-script.md)
- [Two-minute pitch script](docs/submission/pitch-script.md)
- [Go-to-market draft](docs/submission/go-to-market.md)
- [Testnet demonstration handoff](docs/submission/testnet-handoff.md)
- [Official requirements and remaining gates](docs/submission/readiness.md)
- [Technical design](docs/superpowers/specs/2026-10-09-agentproof-design.md)

## Attribution and release status

Original code was created for this entry with **OpenAI Codex** assistance, including design, implementation, tests and review. Dependencies: [viem](https://github.com/wevm/viem) (MIT), [Vite](https://github.com/vitejs/vite) (MIT), [solc-js](https://github.com/ethereum/solc-js) (MIT, compiler components under their upstream licenses), and [Ganache](https://github.com/trufflesuite/ganache) (MIT). The build preserves the installed runtime tree's upstream license texts in [THIRD-PARTY-NOTICES.txt](public/THIRD-PARTY-NOTICES.txt), also copied into the static site. Development-tool notices remain in their npm distributions. No Portaldot/BidUltra code, proprietary customer documents or secrets were reused.

This directory is a private local preparation. **MIT is the proposed release license, pending the owner's approval.** There is no public repository, public deployment, submitted video or final contest entry yet. Do not describe this version as submitted or production-ready.
