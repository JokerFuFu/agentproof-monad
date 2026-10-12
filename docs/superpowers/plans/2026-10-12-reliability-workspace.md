# AgentProof reliability workspace implementation plan

**Goal:** Deliver an isolated, reviewable candidate with recoverable transactions and an honest, usable verification flow.

**Architecture:** Keep the existing manifest and contract protocol. Add a transaction tracking/journal boundary, then build the document workspace around independent integrity, anchor and review states.

**Tech stack:** Existing Vite, vanilla ES modules, viem, Node test runner, jsdom and Playwright. No new production dependencies.

## Constraints

- Base `9077b24`, branch `candidate/reliability-ui`; original checkout unchanged.
- No pushes, merges, public deployments, competition submission edits, external signing, fees or new credentials.
- Only public transaction coordinates are persisted automatically; raw artifacts stay in the editable/exportable package.
- Preserve Solidity, ABI, commitment formula and `agentproof/1` package compatibility.
- Execute inline under the user's existing implementation authorization.

## Task 1: Transaction lifecycle and recovery

Files: `src/transactions.mjs`, `src/chain.mjs`, `tests/connection.test.mjs`, `tests/transactions.test.mjs`.

- [ ] Add failing boundary tests to `transact(connection, actor, functionName, args, {onUpdate})` and `deployMonad(connection, {onUpdate})`: update receives `{hash,state:'broadcast'}` before `waitForTransactionReceipt` runs; timeout exposes `error.transaction` and blocks another submit.
- [ ] Run `node --test tests/connection.test.mjs`, recording the failure before implementation.
- [ ] Implement `trackTransaction(client, submit, details, onUpdate)`, `recoverTrackedTransaction(client, record)`, and `TransactionJournal(storage)`. States are broadcast, unknown, confirmed, reverted, replaced. Validate persisted coordinates; failed persistence retains an in-memory record and blocks writes. Recovery uses only read methods and checks exact from/to/input plus required confirmations.
- [ ] Integrate all five write kinds into `chain.mjs`; export `recoveryConnection(record)` and `recoverChainTransaction(connection,record)`. Track viem replacement callbacks and clear registry-scoped agent IDs on deployment.
- [ ] Test timeout, reload, storage denial, malformed journal, insufficient confirmations, reverted receipts, replacements and different RPC transaction contents. Run the focused tests until green.

## Task 2: Independent verification state and example

Files: `src/main.js`, `tests/ui.test.mjs`.

- [ ] Reproduce stale verified UI by completing `verify`, rejecting the next `verifyChainAnchor` call, then asserting review controls disabled and status unverified/unavailable.
- [ ] Add one-click sample tests using the real fixture and a fetch boundary: zero writes/wallet accesses, cached Accepted hints discarded, fresh live query requested, RPC failure leaves local integrity available.
- [ ] Implement downgrade-before-query, local integrity feedback independent of chain result, revision guarding, and query-only recovery. All write entrypoints reject unresolved journal records even if invoked directly.
- [ ] Run `node --test tests/ui.test.mjs`. Verify an intact rejected/revoked receipt never implies broken content and a wrong connection cannot receive another registry's review.

## Task 3: Delivery workspace

Files: `src/view.mjs`, `src/style.css`, `src/main.js`, `index.html`.

- [ ] Create the source/checklist workspace, three status inspector, linked workflow, clear read-only example CTA, progressive connection controls, and exact version comparison. Preserve explicit labels, live status, keyboard focus and no-LLM copy.
- [ ] Exercise empty source, malformed/oversized imports, output injection, source edits, tamper/restore and source restoration. Add behavior tests for comparisons and actionable states; avoid testing decorative implementation details.
- [ ] Inspect desktop and 390px mobile in the actual browser; resolve layout overflow, focus and console errors.

## Task 4: Deliverable verification

Files: `docs/candidate-validation.md`, external workspace `deliverables/` screenshots, diff and logs.

- [ ] Run `npm test` and `npm run build`, save exit codes and complete logs. Ganache's optional native fallback is a known baseline warning.
- [ ] Exercise browser RPC failures and pending recovery with explicit simulated boundaries; also attempt the real read-only Monad package query and report its actual outcome.
- [ ] Capture actual candidate desktop/mobile screens and save screenshots to Library. Record returned Library IDs and provenance.
- [ ] Review `git diff --check`, contract/package/submission file invariants and the original clean checkout. Produce a patch, diff summary and validation report. Leave the candidate local for review.
