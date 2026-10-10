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

This writes `evidence/monad-rpc.json`. A successful RPC check alone is **not deployment evidence**. On **10 October 2026**, the entrant used two test accounts to deploy the registry, publish a delivery and record reviewer acceptance on Monad Testnet. The exported package was independently checked against the official RPC: exact runtime bytecode, successful publication transaction/event, reconstructed identities and live **Accepted** status all matched. [Confirmed coordinates and verification record](evidence/monad-acceptance.json).

Anyone can reproduce this result without a wallet:

1. Download the [synthetic Monad proof package](public/agentproof-monad-proof.json).
2. Open the [public app](https://jokerfufu.github.io/agentproof-monad/) and choose **Import proof package**. Imported status starts unverified.
3. Choose **Connect read-only**, then **Verify against receipt**. The app queries Monad Testnet and reconstructs the current review state.
4. Try a tampered delivery, verify the mismatch, restore the original and verify again. Export the portable package if needed.

Command-line verification:

```sh
npm run verify:monad
```

Registry: [0x8c671ffbc6d61b6372acba06a93b92ce8bed9196](https://testnet.monadvision.com/address/0x8c671ffbc6d61b6372acba06a93b92ce8bed9196). [Publication transaction](https://testnet.monadvision.com/tx/0x2109b441c85d10f381814efc07236f6992a6e77442f2c9f550a04fd1af4d3fa4). [Reviewer transaction](https://testnet.monadvision.com/tx/0xc6220d62b2c012a0716b296c5eff90bc51ad8f4dcf811042b9d135b89c8858b5). These are real chain **10143** coordinates. The review deadline limits when a pending decision may be made; an accepted decision remains recorded unless the publisher revokes it. A cached file is never a substitute for current live verification.

To publish a new receipt, use a test-only injected wallet, select chain 10143, connect and approve the agent-registration/publication transactions, then switch to a different designated reviewer account and permit the site to access that account. Every external write checks the actual account and network before simulation and signing. The app never requests a private key. Use only test MON from the [official faucet](https://faucet.monad.xyz/); no real funds are required by this demo.

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

The owner approved public source release, **MIT** licensing, free GitHub Pages hosting and public video uploads. Original code and materials are covered by [LICENSE](LICENSE); third-party components retain their upstream terms. The public repository is [JokerFuFu/agentproof-monad](https://github.com/JokerFuFu/agentproof-monad); the Monad Testnet prototype is live on [GitHub Pages](https://jokerfufu.github.io/agentproof-monad/). The entrant completed user-controlled deployment, publication and reviewer transactions on 10 October; the exported synthetic package independently verifies against the actual Monad contract. **The complete contest entry was saved on 10 October at 03:35:44 UTC**, under the entrant's explicit submission authorization. The platform dashboard shows **5/5 complete, All steps complete**, with View submission. The platform judges the last saved copy at the deadline and has no separate Submit operation. [Submission confirmation](evidence/metropolis-submission-confirmation.json). This remains a prototype.

The release pins viem 2.57.4, removing the earlier runtime-tree WebSocket findings. The 13 installed production dependency distributions have no findings in the recorded audit intersection. npm also reports advisories in Ganache's bundled development tree, including critical findings; Ganache is used only for isolated, disposable loopback tests and is not shipped in the static site. See [dependency audit evidence](docs/submission/dependency-audit.md). This is a prototype, not a security-audited production system.

## Public prototype behavior

The hosted page defaults to **Artifact checks**: run, verify, tamper, restore and export without a wallet or a request to local services. To use the disposable Local EVM demo, run the localhost app described above. Monad imports retain their lookup coordinates and select Testnet; an existing registry can be verified with **Connect read-only** without an injected wallet. Publishing, deployment and reviewer decisions still require user-controlled test wallets. Changing the registry disables decisions on the previous receipt until its original registry is reconnected and checked.

## Recorded walkthroughs

[Current Monad Release: technical demo and separate Pitch](https://github.com/JokerFuFu/agentproof-monad/releases/tag/v0.1.2-monad). Both videos are **63.88 seconds**, with subtitles over actual browser recordings of the public app querying Monad Testnet. They show imported/unverified status, live Accepted verification, chain evidence, tamper detection, restoration, export and fresh import/reverification. Wallet transactions were completed by the entrant before this read-only recording.

- [Technical demo](https://jokerfufu.github.io/agentproof-monad/agentproof-monad-demo.mp4)
- [Separate Pitch](https://jokerfufu.github.io/agentproof-monad/agentproof-monad-pitch.mp4)
- [Recording details and limits](docs/submission/recorded-videos.md)

The [earlier local prototype Release](https://github.com/JokerFuFu/agentproof-monad/releases/tag/v0.1.1-prototype) remains a historical development record on local chain 31337. The current Monad videos are included in the independently verified complete platform entry.
