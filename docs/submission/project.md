# Public project draft — not submitted

- **Name:** AgentProof
- **Tagline:** Verifiable receipts for agent deliveries.
- **Track:** Trust, Identity & AI Infrastructure
- **Team:** Solo entry, led by JokerFuFu
- **Build window:** Original work started 9 October 2026.
- **Code:** [Public MIT source](https://github.com/JokerFuFu/agentproof-monad)
- **Static prototype:** [GitHub Pages](https://jokerfufu.github.io/agentproof-monad/) — generation and integrity checks work without a wallet; this is not yet a product running on Monad.
- **Demo / pitch videos / Monad deployment:** Pending. No test wallet is available; the owner requested retaining the current prototype.

## Short description

AgentProof lets an agent publisher commit the source, output and checking policy of a delivery to an EVM receipt. A designated reviewer records acceptance or rejection, and anyone holding the local proof package can independently check its contents against the live contract. Changed work fails verification; revoked receipts remain visible but invalid. The demo uses a synthetic document checklist and separates content integrity from the reviewer's opinion.

## Problem and solution

Agent outputs move between people, tools and versions. A reviewer needs to know which artifact was delivered, which policy it used, who published it and whether the accepted version later changed. AgentProof keeps those commitments and decisions together without putting raw documents on chain. Its portable package includes the text artifacts and salt for independent recomputation.

## Technical implementation

A Solidity registry gives each publisher a wallet-owned agent ID. Receipts contain immutable input/output/policy commitments, a task ID, designated reviewer, expiry and current review state. The reviewer can decide once before expiry; the publisher can revoke. Domain-separated salted SHA-256 commitments are produced in the browser. Verification reconstructs identities from the live registry and a successful publication event, checks the derived receipt ID and expected contract runtime, and rejects fabricated import hints.

The frontend uses Vite and viem. Contract tests execute real bytecode in an isolated local EVM. Monad Testnet integration uses an injected wallet and an Osaka compilation target. **At this draft's date, Testnet RPC connectivity is verified, but contract deployment and transactions remain pending because no test wallet is available.** Replace this sentence with actual chain/address/transaction evidence only after successful deployment and demonstration.

## Why Monad

An agent workflow can produce many small delivery and review receipts. Monad provides an EVM environment in which these state transitions can be independently checked with familiar wallet and contract tooling. The prototype demonstrates publication, verification and reviewer decisions; it does not yet measure throughput, costs or comparative performance. Final materials must show real Monad Testnet transactions, rather than relying on the local EVM.

## Limits and next steps

The included checking agent is deterministic, not an LLM. A commitment proves an unchanged artifact, not accurate reasoning or successful AI execution. A designated reviewer supplies an opinion, and distinct wallet addresses do not prove distinct people. The prototype has no payments, reputation scoring or production security audit. Public source and static hosting are complete. The remaining submission work is actual Testnet acceptance, technical/pitch recording and final declarations.

## Ownership, AI and attribution disclosure

New original work began on 9 October 2026. OpenAI Codex assisted with product design, code, tests, browser acceptance and review. External components are viem, Vite, solc-js and Ganache; see README for upstream links and licenses. No code or private material from Portaldot, BidUltra or customer projects is included. The owner confirmed the right to release this work under MIT. Eligibility and final platform declarations remain for the entrant to review; this draft does not attest to them.
