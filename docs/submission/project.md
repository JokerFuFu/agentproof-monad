# Public project draft — not submitted

- **Name:** AgentProof
- **Tagline:** Verifiable receipts for agent deliveries.
- **Track:** Trust, Identity & AI Infrastructure
- **Team:** Solo entry, led by JokerFuFu
- **Build window:** Original work started 9 October 2026.
- **Code:** [Public MIT source](https://github.com/JokerFuFu/agentproof-monad)
- **Live product:** [GitHub Pages](https://jokerfufu.github.io/agentproof-monad/) — imports and verifies an actual accepted Monad Testnet receipt without a wallet; new writes use entrant-controlled test accounts.
- **Monad deployment:** Chain 10143, registry [0x8c671ffbc6d61b6372acba06a93b92ce8bed9196](https://testnet.monadvision.com/address/0x8c671ffbc6d61b6372acba06a93b92ce8bed9196), deployed 10 October 2026.
- **Demonstration evidence:** [Synthetic portable proof package](../../public/agentproof-monad-proof.json), [confirmed publication](https://testnet.monadvision.com/tx/0x2109b441c85d10f381814efc07236f6992a6e77442f2c9f550a04fd1af4d3fa4) and [reviewer acceptance](https://testnet.monadvision.com/tx/0xc6220d62b2c012a0716b296c5eff90bc51ad8f4dcf811042b9d135b89c8858b5).
- **Technical / Pitch videos:** The historical local recordings are public; updated real Monad walkthroughs are being prepared. Final contest submission remains pending.

## Short description

AgentProof lets an agent publisher commit the source, output and checking policy of a delivery to an EVM receipt. A designated reviewer records acceptance or rejection, and anyone holding the local proof package can independently check its contents against the live contract. Changed work fails verification; revoked receipts remain visible but invalid. The demo uses a synthetic document checklist and separates content integrity from the reviewer's opinion.

## Problem and solution

Agent outputs move between people, tools and versions. A reviewer needs to know which artifact was delivered, which policy it used, who published it and whether the accepted version later changed. AgentProof keeps those commitments and decisions together without putting raw documents on chain. Its portable package includes the text artifacts and salt for independent recomputation.

## Technical implementation

A Solidity registry gives each publisher a wallet-owned agent ID. Receipts contain immutable input/output/policy commitments, a task ID, designated reviewer, expiry and current review state. The reviewer can decide once before expiry; the publisher can revoke. Domain-separated salted SHA-256 commitments are produced in the browser. Verification reconstructs identities from the live registry and a successful publication event, checks the derived receipt ID and expected contract runtime, and rejects fabricated import hints.

The frontend uses Vite and viem. Contract tests execute real bytecode in an isolated local EVM. Monad Testnet integration uses an injected wallet and an Osaka compilation target. On 10 October, two entrant-controlled accounts completed actual deployment, publication and reviewer acceptance. Independent verification of the exported package checked the expected runtime bytecode, successful publication event, publisher/reviewer identities, commitments and current Accepted state against the official RPC. Modifying the output failed commitment verification; restoring it passed.

## Why Monad

An agent workflow can produce many small delivery and review receipts. Monad provides an EVM environment in which these state transitions can be independently checked with familiar wallet and contract tooling. The prototype's actual Monad Testnet publication and reviewer decisions are publicly inspectable, and a judge can independently verify their associated artifacts without a wallet. No throughput, cost or comparative-performance benchmark is claimed.

## Limits and next steps

The included checking agent is deterministic, not an LLM. A commitment proves an unchanged artifact, not accurate reasoning or successful AI execution. A designated reviewer supplies an opinion, and distinct wallet addresses do not prove distinct people. The prototype has no payments, reputation scoring or production security audit. Public source, static hosting and actual Monad Testnet acceptance are complete. The remaining submission work is updated technical/Pitch recordings, saved final project fields and entrant-reviewed declarations.

## Ownership, AI and attribution disclosure

New original work began on 9 October 2026. OpenAI Codex assisted with product design, code, tests, browser acceptance and review. External components are viem, Vite, solc-js and Ganache; see README for upstream links and licenses. No code or private material from Portaldot, BidUltra or customer projects is included. The owner confirmed the right to release this work under MIT. Eligibility and final platform declarations remain for the entrant to review; this draft does not attest to them.
