# AgentProof reliability and delivery workspace

This candidate implements the delegated, already authorized scope on `candidate/reliability-ui`, based on develop `9077b24`. The original checkout is clean and remains untouched. No AGENTS.md applies. The standalone clone is inside the permitted workspace because the app worktree tool cannot target the separate source checkout.

## Behavior

- Persist a transaction's hash, network, registry, actor and encoded call immediately after broadcast, before waiting. Persist no source text, output or salt automatically.
- A receipt timeout or RPC failure after broadcast means **result unknown**. Keep the record across reloads, block new writes, and offer only read-only recovery of that same transaction. Do not automatically continue a registration/publication sequence after recovery.
- Distinguish pre-broadcast failure, confirmed revert, replacement and unknown result. Track replacement hashes. Do not treat a cancellation or changed call as the original successful operation.
- Recovery checks the chain, actual transaction identity, confirmations, receipt and registry implementation. Pending or unavailable transactions remain blocked; terminal failures are explicitly reported.
- Display content integrity, chain anchoring and reviewer decision independently. Clear all live-derived identities and decision data before refreshing the chain; RPC errors cannot retain an old verified or Accepted badge. A rejected or revoked receipt may still have intact artifacts.
- Load `public/agentproof-monad-proof.json` with one click, recompute its commitments, discard cached verification/decision hints, connect read-only and perform fresh verification. A failed live lookup retains usable offline artifacts and a clear retry path.
- Explain that the synthetic checklist uses deterministic presence rules without an LLM. Neither hashes nor reviewer acceptance establish factual correctness or independent human identity.

## Architecture

`transactions.mjs` owns transaction tracking and the browser recovery journal. `chain.mjs` owns wallet/RPC boundaries and recovery validation. `anchor.mjs`, the manifest format, ABI and Solidity contract remain compatible. `view.mjs` contains the workspace markup; `main.js` owns interaction/state; `style.css` owns responsive visual tokens and layout.

## Interface

A delivery workspace prioritizes the wallet-free example. A real four-step guide links preparation, inspection, verification and reviewer decision. A wide document editor sits beside a compact receipt inspector with three independent status rows. Delivery versions are shown side-by-side with exact changed lines and an accessible text summary. Advanced connections and public coordinates remain expandable.

Palette: paper white `#ffffff`, cool canvas `#f3f5fa`, graphite `#202334`, Monad violet `#6557e8`, verified teal `#16715b`, attention ochre `#926316`. System Avenir/Segoe sans carries content; system mono is reserved for literal hashes and artifact JSON. Alignment is left throughout. The receipt's three-part inspection strip is the distinctive visual device; decoration is kept quiet. Mobile stacks the document and receipt, preserves labels and focus, wraps hashes and scrolls long preformatted content inside its panel.

## Verification and scope boundaries

Keep the 21-test baseline, add transaction-boundary and actual DOM regression cases, and use real browser checks for invalid files, empty input, tampering/restoring, RPC failure, pending recovery, reload persistence and narrow viewports. Mocked RPC outcomes must be labeled as simulated evidence. Build and review actual rendered screenshots. Save deliverable screenshots to Library with real returned IDs.

Do not push, merge, deploy publicly, change competition submission files, sign external transactions, incur fees, provision credentials or change the protocol. Existing isolated contract tests may run as part of the authorized local test suite. No performance, model, customer or live-success claims are inferred from mocks.
