# AgentProof local candidate validation — 12 October 2026

Candidate: `candidate/reliability-ui`, based on `develop` commit `9077b24cfd3d6fffffb58a190c4d48a0148e5126`.

Checkout: `/Users/Apple/Documents/Codex/2026-10-12/task-2/agentproof-candidate`.

## Outcome

- `npm test`: **46 passed, 0 failed**, exit 0. The original 21 tests are retained.
- `npm run build`: **passed**, exit 0; Osaka and Shanghai artifacts compiled, Vite production bundle generated.
- `scripts/check-browser-candidate.mjs`: **16 checks passed**, **0 unhandled runtime errors**, **0 send/sign RPC methods** in isolated Chrome.
- `git diff --check`: passed. Solidity, generated contract ABI/runtime artifact, `anchor.mjs`, `proof.mjs`, public Monad proof fixture, package/dependency lock, submission files and original evidence are unchanged from the base.
- Original checkout remains clean on `develop` at `9077b24`. No push, merge, public deployment, new external signing/broadcast, competition edit, fees, new credentials or protocol change occurred.

## Implementation

`transactions.mjs` saves the broadcast hash before receipt waiting. Unknown results survive reloads and block subsequent writes. Same-origin Web Locks serialize preflight/signing/confirmation across tabs; the connection also guards concurrent submissions. A journal cannot overwrite a different transaction, and resolution checks hash ownership.

Read-only recovery verifies the exact sender, destination, calldata, chain, required confirmations and registry implementation. Sender nonce and a broadcast block boundary permit bounded replacement searches after a wait has stopped. Each query scans at most 64 blocks, four reads at a time. Continuous replacements retain original and previous hashes; canonical checkpoints and an eight-block overlap prevent permanently skipping corrected recent history. Missing identity or RPC evidence remains unknown and blocked.

The workspace separately renders artifact integrity, live chain anchoring and the designated-reviewer decision. Verification, registry changes, and review/revocation/deployment writes withdraw prior live-derived fields before queries or broadcasts. A failed RPC cannot leave an old verified badge or decision controls active. Local integrity remains independently visible.

The one-click Monad example fetches the real public fixture, recomputes commitments, discards imported verification/decision hints, and queries the live registry without a wallet. The deterministic synthetic presence rules are explicitly labeled as using no LLM. Responsive source/checklist and receipt views include exact version comparisons, a committed-source restoration action, linked workflow guidance, actionable empty/error states, visible keyboard focus and tab keyboard navigation.

## Browser evidence

Real read-only verification checked registry `0x8c671ffbc6d61b6372acba06a93b92ce8bed9196`, publication `0x2109b441c85d10f381814efc07236f6992a6e77442f2c9f550a04fd1af4d3fa4`, receipt `0x682921d6503d90af908f1c6de086b0b5f3f91a6d7caf8cf4a2556ad79a675e94`. The latest browser run returned matching commitments, a verified Monad Testnet anchor and **Accepted**. This is an existing publication, not a new candidate transaction. Acceptance is a designated wallet's decision; it does not prove factual accuracy.

The browser run covered empty source, malformed/oversized imports preserving current work, changed source and restore, tamper comparison, keyboard navigation, four widths (320/390/768/1440) with no page overflow, actual live verification, and intact contents with failed chain verification. RPC outage was **simulated** using a browser network block. Recovery's unknown journal was **seeded with the existing confirmed public example** and recovered through real RPC. Native browser locking used **simulated submission boundaries in local storage**; no wallet or chain write was invoked. Transaction signing, replacement and failure unit boundaries are mocked; original contract tests use an isolated in-memory EVM.

Independent code review found three P1 cases (write-path stale evidence, post-timeout replacement recovery and cross-tab overlap) and two P2 cases (continuous replacement persistence and stale scan cursors). Each was reproduced with a failing regression and corrected; all final tests pass.

## Deliverables

Files are in `/Users/Apple/Documents/Codex/2026-10-12/task-2/deliverables/`:

- `agentproof-desktop.png`: actual final desktop browser rendering, 1440px wide.
- `agentproof-mobile.png`: actual final mobile browser rendering, 390px wide.
- `browser-candidate-checks.json`: 16-check report and actual read-only RPC method trace.
- `final-tests.log`, `final-build.log`: full command output with passing results.
- `red-regressions.log`: original failing transaction/UI reproductions.
- `earlier-playwright-evidence.json`: earlier real read-only verification, simulated RPC failure and recovery observations.
- `library-screenshots.json`: confirmed screenshot Library metadata.
- `agentproof-candidate.patch`, `diff-summary.txt`: final candidate changes relative to `9077b24`.

Library screenshot IDs:

| Screenshot | Library ID | File ID |
| --- | --- | --- |
| Desktop | `libfile_7dfa320d7d908191aed8489173b03f10` | `file_00000000522882308fabe4ad5dbb5edb` |
| Mobile | `libfile_bbfa79a7991481919abf71a2fe9d1f37` | `file_00000000c79482308d9c9d6eaf00c3c1` |

Both Library creates confirmed success; returned version metadata was applied to the local screenshots. The prepared-upload helper's preflight was unavailable, so the supported direct batch creation route was used. No duplicate Library files were created.

## Practical limits

Unknown results require usable RPC evidence. If the original sender nonce was never observed and the original hash has disappeared, a replacement cannot be proven automatically; the app preserves the hash and blocks writes. Long replacement histories may need repeated read-only recovery queries. Raw artifacts are not automatically persisted; export their package to retain them across reloads. Browsers without Web Locks can verify read-only but cannot write. No external wallet write was exercised in this candidate acceptance run.

Ganache uses its JavaScript fallback because optional native bindings do not match Node 26; the same warning exists in the clean baseline, and its contract tests pass. The browser plugin disconnected during additional checking; an isolated local Chrome/CDP run completed the full acceptance flow and captured the final screenshots. There are **no remaining delivery blockers**.

For local review: `npm run dev -- --port 5197`, then open `http://127.0.0.1:5197/`.
