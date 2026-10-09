# Validation evidence — local prototype

9 October 2026. This record distinguishes real local execution from external deployment.

- `npm test`: 12 passed, 0 failed, including real contract bytecode and fabricated-anchor regression tests. Optional Ganache native bindings are unavailable on Node 26; its JavaScript fallback executes the tests successfully.
- `npm run build`: Solidity Shanghai and Osaka compilation and Vite production bundle succeed. No production deployment is implied.
- Browser at `http://127.0.0.1:5187/`: connect → run → publish confirmed in local block 3 → verify Pending → tamper returns **Output commitment mismatch** → restore → designated reviewer accepts → live verify returns **Accepted**.
- Reviewed import handling: imported identities/status are discarded, source/output/policy are restored, unknown runtime or fake publication is rejected, and edits clear validation feedback. Independent review found the earlier five issues resolved.
- Monad read-only RPC: chain 10143, block **69474621**, hash `0x11861c4e14d38ac79e80fecd98185ab5f061c847a6ee43a8a8580b6e70f4f9a0`, checked **2026-10-09T06:58:12.744Z**. See `evidence/monad-rpc.json`. This does not prove a contract was deployed.

Local browser publication evidence: registry `0x27097fe6a60f1248891a803318a4bac014c625c4`, receipt `0x482943ccfd992f98294cb0598b186fdd04bc56a586b929da21eecdac9266fdb3`, transaction `0x795ed43c7bdd46a8ecf9d73832c45c93b1e29881cf5bd3c02c1c9f695cfb1f60`. The local chain is disposable; restarting replaces it and makes these coordinates historical evidence only.

Not validated yet: injected-wallet Testnet end-to-end signatures, public hosting, public video, final contest declarations or final entry. Do not claim these are complete.

## Resumed acceptance — 9 October, 16:50 Beijing

Fresh test run: 12/12 pass, no failures; production bundle builds. A new disposable local chain was started. Browser publication and designated-reviewer acceptance succeeded. The export control rendered its complete JSON backup; its content was saved to `evidence/browser-proof-package.json` (2,580 bytes), read back, recomputed and checked against the live contract. No native browser download file was found; the browser download-event tool had stalled, so file generation was verified through the visible copy-backup route instead.

The saved file was imported through the actual browser file chooser. The UI restored the input/output/policy, showed **Imported / unverified**, and disabled review/revocation. Live verification then reconstructed **Accepted**. Publisher revocation succeeded; re-verification displayed **Integrity matches, but publisher revoked this receipt** with invalid styling.

Registry `0xb5c144774c55b8170b883ccabbc5695c51af6cee`, receipt `0x0bf05777b260bc65128d51a48f3a05d238215de321bf6ec9bd72d3c48d1dbb4e`, publication `0xafe6b1d796f2c5c6dec192e11f9e4c3f6bd1da8827284727f4eb1a2c924252bb`, local chain 31337. The exported file's cached Accepted field is historical; live verification now correctly sees Revoked. This is not Monad evidence.

## Release-candidate checks

The last code change adds a visible deployment-evidence JSON backup and avoids claiming a browser download was confirmed. The brand link and production assets use relative project paths. An original 1024×1024 PNG logo was added and visually inspected; it meets the platform's dimensional/file-size requirements.

Fresh `npm test`: **12 passed, 0 failed** (2,017.7 ms). Final `npm run build`: upstream license texts for all 13 installed production dependency distributions are preserved; both contract targets compile to 2,850-byte deployment artifacts and Vite builds successfully (1.67 s). A loopback static server served the compiled bundle under `/agentproof-monad/`; HTML, JavaScript, stylesheet and logo all returned HTTP 200 and stayed under that project path. This verifies static path resolution, not public deployment or the injected-wallet flow.

The browser-control connection stopped after the form displayed Saving. Later form persistence, logo upload, new deployment-export UI, and real Testnet end-to-end behavior remain unverified. No final entry or public release was performed.
