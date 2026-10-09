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

The deployment button prepares network/address/transaction evidence for download and displays a copyable backup after two confirmations. The proof package includes the publication transaction. Verify these live and retain the explorer links before claiming Monad integration in a submission. The public static prototype can run the synthetic checking and artifact-integrity flow. Publication on a local EVM requires the loopback service on the viewer's machine; the static site does not host a shared local chain.

## Tests and materials

`npm test` runs 21 tests. The original 12 exercise the proof engine and real compiled contract bytecode: content changes, malformed packages, permissions, duplicate receipts, self-review, expiry, terminal review, revocation, fake registry implementations and publication transactions, reconstructed identities, and actual wallet account selection. Nine additional UI/connection regressions cover public artifact-only mode, stale source publication, malformed output imports, wallet-free read-only lookup, registry changes and deployment state. Their wallet/RPC boundaries are mocked; they do not establish actual Monad integration. `npm run build` compiles both targets and builds the web app. The browser acceptance flow is recorded in `docs/submission/validation.md`.

- [Submission draft](docs/submission/project.md)
- [Three-minute demo script](docs/submission/demo-script.md)
- [Two-minute pitch script](docs/submission/pitch-script.md)
- [Go-to-market draft](docs/submission/go-to-market.md)
- [Testnet demonstration handoff](docs/submission/testnet-handoff.md)
- [Official requirements and remaining gates](docs/submission/readiness.md)
- [Technical design](docs/superpowers/specs/2026-10-09-agentproof-design.md)

## Attribution and release status

Original code was created for this entry with **OpenAI Codex** assistance, including design, implementation, tests and review. Dependencies: [viem](https://github.com/wevm/viem) (MIT), [Vite](https://github.com/vitejs/vite) (MIT), [solc-js](https://github.com/ethereum/solc-js) (MIT, compiler components under their upstream licenses), and [Ganache](https://github.com/trufflesuite/ganache) (MIT). The build preserves the installed runtime tree's upstream license texts in [THIRD-PARTY-NOTICES.txt](public/THIRD-PARTY-NOTICES.txt), also copied into the static site. Development-tool notices remain in their npm distributions. No Portaldot/BidUltra code, proprietary customer documents or secrets were reused.

The owner approved public source release, **MIT** licensing, free GitHub Pages hosting and later public video uploads on 9 October 2026. Original code and materials are covered by [LICENSE](LICENSE); third-party components retain their upstream terms. The public repository is [JokerFuFu/agentproof-monad](https://github.com/JokerFuFu/agentproof-monad); the static prototype is live on [GitHub Pages](https://jokerfufu.github.io/agentproof-monad/). Its generation, integrity, tamper and restore flow was verified in a real browser. **No Monad deployment, submitted video or final contest entry exists yet.** The owner has no test wallet and requested retaining the prototype for now. Do not describe this prototype as submitted or production-ready.

The release pins viem 2.57.4, removing the earlier runtime-tree WebSocket findings. The 13 installed production dependency distributions have no findings in the recorded audit intersection. npm also reports advisories in Ganache's bundled development tree, including critical findings; Ganache is used only for isolated, disposable loopback tests and is not shipped in the static site. See [dependency audit evidence](docs/submission/dependency-audit.md). This is a prototype, not a security-audited production system.

## Public prototype behavior

The hosted page defaults to **Artifact checks**: run, verify, tamper, restore and export without a wallet or a request to local services. To use the disposable Local EVM demo, run the localhost app described above. Monad imports retain their lookup coordinates and select Testnet; an existing registry can be verified with **Connect read-only** without an injected wallet. Publishing, deployment and reviewer decisions still require user-controlled test wallets. Changing the registry disables decisions on the previous receipt until its original registry is reconnected and checked.
