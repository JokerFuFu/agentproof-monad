# AgentProof design

New work begins 9 October 2026 in this independent directory. No Portaldot or BidUltra code, documents, customer data, credentials or branding are reused.

## Choice and success criteria

Choose Trust, Identity & AI Infrastructure. An agent delivery receipt is a narrower, demoable product than a payments application (funds and onboarding risk) or a general agent marketplace (liquidity and large scope). Official public rules identify the track and required deliverables, but publish no detailed scoring weights. This recommendation is a fit and delivery-risk judgment, not a claimed scoring advantage.

Success: a reviewer can run a synthetic document-checking workflow, publish salted commitments for the input, output and policy, independently recompute the output commitment, detect tampering, and issue a designated-reviewer attestation. The UI visibly distinguishes a local EVM demonstration from actual Monad Testnet. An onchain receipt establishes publisher, timestamp and integrity; it does not establish factual accuracy, legal compliance or correct AI execution.

## Components and data

`AgentProofRegistry.sol`: wallet-owned agent IDs and immutable receipt content. Agent owner publishes; one designated reviewer accepts/rejects before expiry; owner may revoke at any time. Self-review, duplicate task receipts, zero commitments, unauthorized mutation and late review are rejected. Reputation scoring, payments, transferable IDs, ERC-8004 compliance, cryptographic proof of AI execution and confidential-data hosting are excluded.

`src/proof.mjs`: domain-separated salted SHA-256 artifact commitments, deterministic synthetic checking agent, portable manifest, integrity verification. A random 256-bit salt stays with the local proof package. The contract never stores raw document contents. Anyone given a manifest can learn its contents; hashes and wallet addresses are public after publication.

`src/main.js`: single-page workbench. Left: synthetic input and checking rules, edit/run/publish. Right: receipt, current chain evidence, tamper/verify, reviewer outcome, JSON export. Local demo uses disposable loopback-only chain accounts. Monad mode uses an injected wallet and requires user signature for every external write; user keys never enter app code. Wallet deployment produces a download of network/contract/tx details and stores only public deployment config.

## UI direction

An evidence desk with a prominent document-to-receipt path. Colors: ink #20394b, paper #f3f7fa, white #ffffff, blue #2368c4, proof #15796b, warning #9e4c18. Avenir/Segoe UI for readable UI and system monospace only for addresses and hashes. Main workbench is left aligned, split 55/45 on desktop, stacked on mobile. Different shapes distinguish editable source, immutable receipt and evidence details. No decorative metric cards or invented transaction counts.

## Verification and error handling

Contract tests run real compiled bytecode in an isolated EVM, including unauthorized publisher/reviewer, self-review, duplicate receipt, expiry, terminal review and revocation. Proof tests cover changed content, domain separation, salt changes, malformed packages and deterministic agent output. Compiler artifacts for local tests target Shanghai supported by Ganache; Monad deployment artifact targets Osaka per current official guidance. Both derive from identical source and are independently compiled. UI exposes pending/confirmed/reverted states and never treats a submitted hash as confirmation.

## Delivery and boundaries

Prepare README, English public-profile draft, short pitch, demo script, rules matrix, reproducibility commands, deployment checklist and acceptance evidence. Public push/deploy/final entry and any new agreement/OAuth grant remain explicit approval steps. Registration/login is pending user login. Exact deadline time/timezone, platform rules, eligibility and fees remain unverified until official platform is accessible. Target readiness by 12 October UTC as an internal buffer, not an official deadline.
