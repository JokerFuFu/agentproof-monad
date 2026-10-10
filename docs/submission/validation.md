# Validation evidence — Monad Testnet and local prototype

## Complete platform entry — 10 October 2026, 03:35 UTC

The entrant expressly authorized direct submission once project checks passed. The existing authenticated participant session remained active. `/policies/outstanding` returned an empty list. The platform's `/submission` response explicitly states that judges read the last saved copy at the deadline and there is no separate Submit operation.

The same `PUT /api/v1/submission/entry` used by the platform's published Save submission / Save changes client saved the updated description, real live product, both actual Monad video links and judge access instructions. The existing project, track, logo and acquisition plan were retained. HTTP 200 returned `lastSavedAt: 2026-10-10T03:35:44.870Z`. A fresh independent GET confirmed all five changed fields exactly match the prepared values; all five required groups are complete, platform standing is eligible with no missing items, and the submission window is open.

The authenticated dashboard then showed **5/5 complete**, **All steps complete** and **View submission**; the Submit your project step was checked. A native screenshot was retained in the private handoff. No new policy acceptance, wallet signing or funds movement occurred. [Public confirmation record](../../evidence/metropolis-submission-confirmation.json). Earlier pending-submission statements below are historical checkpoints.

## Actual Monad acceptance — 10 October 2026

The entrant created two test accounts and personally approved deployment, agent registration, publication and reviewer acceptance on **Monad Testnet, chain 10143**. No assistant-held key or simulated wallet was used for these transactions.

The exported 2,586-byte synthetic package was independently verified at **2026-10-10T02:37:48.966Z** using the official RPC. The expected 2,822-byte Osaka runtime matched exactly; successful publication/event, derived receipt ID, publisher ownership, designated reviewer and all three artifact commitments matched the live contract. The current receipt state was **Accepted**. Changing the output failed verification; restoring the original passed. [Public acceptance record](../../evidence/monad-acceptance.json), [portable synthetic package](../../public/agentproof-monad-proof.json).

| Action | Successful transaction | Block |
|---|---|---|
| Deploy registry | [0x9c01d794…73d971f](https://testnet.monadvision.com/tx/0x9c01d79423a2fc2b0e0b218f41e93739fd1baa6fa8f82a70ad0b7fb4f73d971f) | 69703477 |
| Register agent | [0x584b783a…41fe15f](https://testnet.monadvision.com/tx/0x584b783ac98866925a0f8bdf6aabde1805029883d71016446d4817e3c41fe15f) | 69706503 |
| Publish receipt | [0x2109b441…f4d3fa4](https://testnet.monadvision.com/tx/0x2109b441c85d10f381814efc07236f6992a6e77442f2c9f550a04fd1af4d3fa4) | 69706546 |
| Reviewer accepts | [0xc6220d62…8858b5](https://testnet.monadvision.com/tx/0xc6220d62b2c012a0716b296c5eff90bc51ad8f4dcf811042b9d135b89c8858b5) | 69707407 |

Registry `0x8c671ffbc6d61b6372acba06a93b92ce8bed9196`; receipt `0x682921d6503d90af908f1c6de086b0b5f3f91a6d7caf8cf4a2556ad79a675e94`. The two accounts belong to the entrant; distinct addresses do not establish distinct people. The pending-review deadline was 11 October 02:30:36 UTC; the recorded acceptance remains inspectable after that deadline. Live revocation can still invalidate a receipt. Submission was pending at this initial 02:37 UTC verification checkpoint; the later complete-save record above supersedes that status.

## Current build, public replay and recording — 10 October 2026

Fresh checks after adding the Monad CLI verifier and updating the header: **21/21 tests passed**, no failures (1,206.59 ms). solc 0.8.30 compiled the Osaka and Shanghai deployment artifacts, each 2,850 bytes; Vite 7.3.7 built successfully (601 ms). `npm run verify:monad` independently verified the exported package against the live contract, reconstructed Accepted state, detected tampering and passed after restoration. No contract behavior changed.

Source commit `14d08416456042fc542641e80a00d0a8f956ed13` and static site commit `6a58815a3fb98e0788d1dc4bf2087f48078a3472` were pushed. All eight public site assets returned HTTP 200 and matched the local production build. An actual separate browser without a wallet imported the synthetic package as unverified, connected read-only, verified Accepted, detected tampering, restored, exported a real downloaded file, then reimported and independently verified Accepted again.

Two separate subtitle-only videos of that actual Monad replay were published in [Release v0.1.2-monad](https://github.com/JokerFuFu/agentproof-monad/releases/tag/v0.1.2-monad). Both are 63.88-second H.264 MP4s at 1440×1040. Anonymous downloads match their local SHA-256 values. They are also served as `video/mp4` on Pages, site commit `61ead4e500065db4a88c235f8a01037bfcc62f9b`, with HTTP 200 and matching hashes. [Recording manifest](../../evidence/monad-recording-manifest.json), [recording details](recorded-videos.md). Signing happened before recording; the footage demonstrates actual read-only replay. A separate explorer-page navigation timed out and is omitted, while official RPC verification succeeded.

At the earlier recording checkpoint the authenticated contest dashboard showed **4/5 onboarding steps** and the correct 14 October 11:59 GMT+8 deadline. The project form remained at Loading after refresh. The subsequent official save and independent read above confirmed the complete entry, followed by the dashboard's **5/5** state; no form-loading recovery is implied.

The following sections retain the historical local-development record. Their pending-Monad statements describe those earlier checkpoints; the actual Testnet acceptance above supersedes them.

9 October 2026. This record distinguishes real local execution from external deployment.

- `npm test`: 12 passed, 0 failed, including real contract bytecode and fabricated-anchor regression tests. Optional Ganache native bindings are unavailable on Node 26; its JavaScript fallback executes the tests successfully.
- `npm run build`: Solidity Shanghai and Osaka compilation and Vite production bundle succeed. No production deployment is implied.
- Browser at `http://127.0.0.1:5187/`: connect → run → publish confirmed in local block 3 → verify Pending → tamper returns **Output commitment mismatch** → restore → designated reviewer accepts → live verify returns **Accepted**.
- Reviewed import handling: imported identities/status are discarded, source/output/policy are restored, unknown runtime or fake publication is rejected, and edits clear validation feedback. Independent review found the earlier five issues resolved.
- Monad read-only RPC: chain 10143, block **69474621**, hash `0x11861c4e14d38ac79e80fecd98185ab5f061c847a6ee43a8a8580b6e70f4f9a0`, checked **2026-10-09T06:58:12.744Z**. See `evidence/monad-rpc.json`. This does not prove a contract was deployed.

Local browser publication evidence: registry `0x27097fe6a60f1248891a803318a4bac014c625c4`, receipt `0x482943ccfd992f98294cb0598b186fdd04bc56a586b929da21eecdac9266fdb3`, transaction `0x795ed43c7bdd46a8ecf9d73832c45c93b1e29881cf5bd3c02c1c9f695cfb1f60`. The local chain is disposable; restarting replaces it and makes these coordinates historical evidence only.

At this initial check, injected-wallet Testnet signatures, public hosting, public video and final entry were not validated. Public hosting was subsequently verified below; Testnet signatures, videos and final entry remain pending.

## Resumed acceptance — 9 October, 16:50 Beijing

Fresh test run: 12/12 pass, no failures; production bundle builds. A new disposable local chain was started. Browser publication and designated-reviewer acceptance succeeded. The export control rendered its complete JSON backup; its content was saved to `evidence/browser-proof-package.json` (2,580 bytes), read back, recomputed and checked against the live contract. No native browser download file was found; the browser download-event tool had stalled, so file generation was verified through the visible copy-backup route instead.

The saved file was imported through the actual browser file chooser. The UI restored the input/output/policy, showed **Imported / unverified**, and disabled review/revocation. Live verification then reconstructed **Accepted**. Publisher revocation succeeded; re-verification displayed **Integrity matches, but publisher revoked this receipt** with invalid styling.

Registry `0xb5c144774c55b8170b883ccabbc5695c51af6cee`, receipt `0x0bf05777b260bc65128d51a48f3a05d238215de321bf6ec9bd72d3c48d1dbb4e`, publication `0xafe6b1d796f2c5c6dec192e11f9e4c3f6bd1da8827284727f4eb1a2c924252bb`, local chain 31337. The exported file's cached Accepted field is historical; live verification now correctly sees Revoked. This is not Monad evidence.

## Release-candidate checks

The last code change adds a visible deployment-evidence JSON backup and avoids claiming a browser download was confirmed. The brand link and production assets use relative project paths. An original 1024×1024 PNG logo was added and visually inspected; it meets the platform's dimensional/file-size requirements.

Fresh `npm test`: **12 passed, 0 failed** (2,017.7 ms). Final `npm run build`: upstream license texts for all 13 installed production dependency distributions are preserved; both contract targets compile to 2,850-byte deployment artifacts and Vite builds successfully (1.67 s). A loopback static server served the compiled bundle under `/agentproof-monad/`; HTML, JavaScript, stylesheet and logo all returned HTTP 200 and stayed under that project path. This verifies static path resolution, not public deployment or the injected-wallet flow.

The browser-control connection stopped after the form displayed Saving. At that checkpoint, form persistence and public release had not yet been confirmed. The later checks below resolve those two items. The injected-wallet deployment-export UI and real Testnet end-to-end behavior remain unverified.

## Authorized MIT release and public acceptance

After the owner authorized the public MIT release, viem was updated to 2.57.4 and both artifacts rebuilt. Tests passed **12/12**, 0 failed (2,291.8 ms), and the final site build succeeded (1.09 s). See `dependency-audit.md` for the remaining Ganache development-tree advisories; an all-dependencies-clean claim would be incorrect.

The public repository is `https://github.com/JokerFuFu/agentproof-monad`, default branch `develop`, with the MIT license. Free GitHub Pages serves `https://jokerfufu.github.io/agentproof-monad/` from `gh-pages`. The Pages API reports built, HTTPS enforced. The actual public browser page successfully runs the deterministic agent, reports matching artifacts as **Not anchored on a chain**, detects a changed output as **Output commitment mismatch**, and matches again after Restore. Root license and third-party runtime notices are shipped with the static site. No Monad transaction is implied.

Because changing the contract SPDX changes compiler metadata, the disposable loopback chain was restarted to deploy the current MIT bytecode. Browser connect → run → publish → reviewer accepts → live verify succeeds. The visible export backup was saved as `evidence/browser-release-package.json` and imported through the actual file chooser. Imported status was initially unverified; live verification reconstructed **Accepted**. This new receipt is left accepted for the local demonstration rather than revoked. Local chain restarts and expiry can invalidate later replay.

Current local registry `0x1c3255c2b0d6fd57888443f4e8dde7d2638727c9`, receipt `0x6f28f4b44cb3adf9e1d92eea4fb352aa42d8792fbe13acedc11d1d5edebaa65b`, publication `0xb2882ca75f09a2949cf127bbf12c2af1bbc23ea7773b0375ffce3d1ff907be9f`, chain 31337. These are local evidence, not Monad addresses or transactions.

A fresh authenticated platform page confirms the saved draft at **09:50 UTC on 9 October**, checklist **3/5**, with logo, selected track, description, acquisition text, public repository URL and judge instructions. Live product and both video links remain blank. The user has no test wallet and requested retaining the prototype; no final contest entry was submitted.

## Fresh issue reproduction and fixes — 9 October, fresh recheck

The existing 12 tests passed on the fresh checkout, but did not cover the browser failures. On the actual public Chrome page, selecting Local EVM requested access to applications/services on the device. That unexpected permission was denied; the old UI then reported Failed to fetch. The hosted prototype now defaults to Artifact checks and disables local connection outside localhost; a connection-level guard blocks the request before fetch.

Fresh full run after fixes: **21 passed, 0 failed** (1,959.8 ms). Production build uses Vite **7.3.7** and succeeds (907 ms); both Solidity targets remain 2,850 bytes. Nine new tests exercise the actual application module and connection implementations: old-source publication, malformed checklist imports, retained Monad coordinates and read-only lookup, offline artifact checks, cross-registry review/revoke guards and deployment invalidation. Wallet/RPC calls are mocked in these new boundary tests. They are not evidence of a Monad transaction.

A fresh native Chrome acceptance run on the local application successfully connected, generated a delivery, published in block 3, accepted with the designated sandbox reviewer, verified against the live contract, detected an output edit, restored the original and verified Accepted again. The browser download UI reported **agentproof-package.json, 2,579 B, complete**; the downloaded file was read from disk, recomputed and checked against the live local registry. Saved as `evidence/browser-recheck-package.json`.

Local registry `0xfccfbe29ed35d6cb861d02dc6319436bc9e47215`, receipt `0x6348c410043cc084d88a5a5313b0b2b48733de9630c67e17a3658b00aee19dab`, publication `0xa9de81cd3078e7504a81eb6fd4fe7d8f8465ac0a7cce101ec0a7b9813f9e5515`. This disposable **31337** chain is not Monad; earlier local registries above are historical.

Two distinct subtitle-only videos were produced from 64 actual Chrome screen captures collected at approximately one frame per second. Capture gaps between operations were edited out; this is an edited walkthrough, not continuous high-frame-rate recording. Browser chrome was cropped out, explanatory captions added, and H.264 MP4 encoded at 1920×1440, 25 fps, **64 seconds** each. No voice or likeness was synthesized. Every segment labels Local EVM 31337 / Not Monad and Testnet deployment pending. One is a local prototype walkthrough, not the required final Monad technical demo; the other is a project Pitch.

The final static release is gh-pages **88e7a898b46c02ba3713be68cd1968af4985e7e8**, built from code commit **bbe925757e28aaa9bf7fa91b216a93030c5ae2c9**. Pages reports built at 15:32:06 UTC. All seven served files returned HTTP 200 and matched that published commit's SHA-256. An actual fresh public Chrome page shows Artifact checks as default and Local EVM disabled, without a new local-network prompt. Run → artifact match → tamper mismatch → restore match succeeds. Importing the newly exported local package through the real file chooser keeps its chain evidence unverified, disables chain decisions and permits artifact-only checks with the explicit **Chain status unverified** label.

The public prerelease `v0.1.1-prototype` is confirmed non-draft. Uploaded assets are the 1,163,349-byte local prototype and 524,921-byte compact Pitch, both video/mp4 with digests matching local files. The compact Pitch is 1280×960, 1 fps, 64 seconds; its smaller encoding was used after upload timeouts. The original 1920×1440 Pitch remains local. This resolves public video hosting, not the missing Monad technical demonstration or final entry.
