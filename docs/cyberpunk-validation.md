# AgentProof visual iteration validation — 12 October 2026

Candidate branch: `candidate/reliability-ui`, continuing from `4965afc5d164630c751ff1d7d986100f5b21b053`.

Checkout: `/Users/Apple/Documents/Codex/2026-10-12/task-2/agentproof-candidate`.

## Delivered change

The workspace now uses a violet-black cyberpunk palette with readable lavender actions, layered panels, generous spacing and restrained grid/orbit details. `public/proof-courier.svg` is original vector art: a friendly robot carrying a receipt, with no invented verification or approval labels. It is identified as original AgentProof artwork, not an official Monad character. No third-party character assets or new dependencies were added.

The source, editor and receipt views retain their real state controllers. Mint, amber and rose state accents supplement explicit text. On phones, controls have a 44px minimum height, workflows stack, and the courier shrinks to a compact illustration. Only the decorative hero character floats gently; reduced-motion preferences disable animations, transitions and smooth scrolling.

`src/experience.mjs` adds a native **How it works** dialog explaining content integrity, chain anchoring and the designated reviewer's decision. It wraps forward/reverse keyboard focus, closes with Escape and restores focus to its opener. The dialog's example action follows the existing busy/disabled state and invokes the established read-only example action. It adds no wallet, signing, RPC or transaction implementation.

## Verification

- `npm test`: **46 passed, 0 failed**, exit 0. Existing contract, transaction and UI regressions are retained.
- `npm run build`: **passed**, exit 0; Osaka and Shanghai artifacts compiled and Vite emitted the production bundle.
- `scripts/check-browser-candidate.mjs`: **24 checks passed**, **0 unhandled runtime errors**, **0 send/sign RPC methods**.
- Browser checks include the original import, empty-state, tamper/restore, version comparison, live RPC failure/retry, seeded recovery and Web Locks flows; they also cover the original decorative asset, skip link, guide keyboard open, Tab/Shift+Tab containment, Escape/focus return, disabled-action delegation, contrast and reduced motion.
- Guide bounds fit actual **320×568** and **390×844** viewports. Comparison layouts have no page overflow at **320, 390, 768 and 1440px**. Additional targeted checks found no page or courier overflow at **601, 800 and 1050px**.
- Sampled text contrast ratios: body **17.37:1**, secondary panel text **9.41:1**, primary action **8.19:1**, source editor **15.51:1**. These are measured samples, not a claim of a full accessibility audit.
- Desktop, phone and guide screenshots were inspected visually. Final capture waits for fonts and finite UI transitions; it does not alter the displayed verification state.
- `git diff --check`: passed. Transaction, chain, anchor and proof modules, contract source/artifact, public Monad fixture, package/lock files, original evidence and competition submission files are unchanged from `4965afc`.
- Original checkout remains clean on `develop`, `9077b24cfd3d6fffffb58a190c4d48a0148e5126`.

Real, fresh read-only queries returned **Matches commitments**, **Verified on Monad Testnet**, and the existing designated wallet's **Accepted** decision. Registry: `0x8c671ffbc6d61b6372acba06a93b92ce8bed9196`. Publication: `0x2109b441c85d10f381814efc07236f6992a6e77442f2c9f550a04fd1af4d3fa4`. No new candidate transaction was signed or broadcast. The RPC outage is simulated by blocking browser requests; the recovery journal is seeded with that existing confirmed public transaction. Locking checks simulate submission boundaries in local storage. Existing unit wallet/RPC boundaries are mocked and contract tests use an isolated in-memory EVM.

The original functional implementation and its limitations remain documented in [candidate-validation.md](candidate-validation.md). No push, merge, public deployment, competition change, fees, new credentials or protocol change occurred.

## Deliverables and Library

Evidence folder: `/Users/Apple/Documents/Codex/2026-10-12/task-2/deliverables/cyberpunk/`.

| File | Evidence |
| --- | --- |
| `agentproof-cyberpunk-desktop.png` | Actual final full-page rendering, 1440×2489 |
| `agentproof-cyberpunk-mobile.png` | Actual final full-page rendering, 390×4219 |
| `agentproof-guide-desktop.png`, `agentproof-guide-mobile.png` | Actual guide renderings, 1440×1080 and 320×568 |
| `browser-candidate-checks.json`, `browser-cli.log` | Passing 24-check report, actual read-only RPC method trace and CLI result |
| `additional-layout-checks.json` | Intermediate viewport/courier bounds |
| `unit-tests.log`, `build.log` | Full successful command output |
| `library-screenshots.json` | Confirmed new Library items and version metadata |
| `agentproof-cyberpunk.patch`, `diff-summary.txt` | This iteration relative to `4965afc` |
| `agentproof-complete-candidate.patch` | Complete local candidate relative to original `9077b24` |
| `local-commit.txt` | Local commit identity |

Both screenshot Library creates confirmed **succeeded**. Returned version attributes were applied immediately to the corresponding local PNGs. Previous functional screenshots and Library items are preserved.

| Screenshot | Library ID | File ID |
| --- | --- | --- |
| Desktop | `libfile_3d51755686e88191a39262c04bb3cc24` | `file_000000003f208230b6d0e0a923c2c343` |
| Mobile | `libfile_bd0f8c6969e88191bc7d82dfbaf37ece` | `file_000000001e6c81fdb2a70223c2117dce` |

Ganache's optional native bindings do not match Node 26, so the unchanged JavaScript fallback was used; all contract tests pass. External wallet writes were not exercised. There are no remaining local implementation or screenshot blockers.

For local review: `npm run dev -- --port 5197`, then open `http://127.0.0.1:5197/`.
