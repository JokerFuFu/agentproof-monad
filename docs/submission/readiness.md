# Metropolis complete entry and verification

The complete AgentProof entry was saved **10 October 2026 at 03:35:44 UTC / 11:35:44 Beijing**, following the entrant's explicit instruction to submit directly after project verification. The authenticated dashboard displays **5/5 complete**, **All steps complete**, and **View submission**. [Public confirmation record](../../evidence/metropolis-submission-confirmation.json).

## How this platform submits

The official `/api/v1/submission` response says that judges read the last saved copy at the deadline and there is no separate Submit operation. The published client uses `PUT /api/v1/submission/entry` for Save submission / Save changes. That operation returned HTTP 200 with `lastSavedAt: 2026-10-10T03:35:44.870Z`. A fresh independent read confirmed every updated field, all five required groups, `standing.eligible=true` and `missing=[]`. The dashboard subsequently checked the Submit your project step.

The earlier project form remained at Loading; the official save interface in the same authenticated participant session was used instead. No duplicate account, new OAuth authorization, policy acceptance, wallet signature or funds movement occurred. The outstanding-policy endpoint returned an empty list. Saved content remains editable before the deadline.

## Deadline and rules

Deadline: **14 October 2026, 11:59 Asia/Shanghai / 03:59 UTC**. The platform independently returns `2026-10-14T03:59:00.000Z` and the logged-in dashboard displays **OCT 14 · 11:59 GMT+8**.

The [full platform policy](https://hackathon.monad.xyz/api/v1/policies/current), Metropolis Hackathon Rules & Guidelines **v3**, updated 3 September, was verified on 9 October. Its content hash is `99725db2fe499bb7a57ec19bf3d504d93babe7e1450b514842ccc971d93a2209`; §4.2 uses 13 October 2026, 11:59 PM ET. The full policy takes priority over abbreviated marketing guidance. The five equally weighted criteria are completeness, technical quality, Monad integration, track/problem fit and innovation/impact.

## Saved deliverables

| Item | Verified current state |
|---|---|
| Project and track | AgentProof, solo team, Trust, Identity & AI Infrastructure |
| Project description and acquisition plan | Updated real Monad implementation, limits, attribution, planned opt-in pilot; no claimed existing customers or revenue |
| Logo | Existing original 1024×1024 PNG retained, previously previewed and verified |
| Public source | Complete source, setup README, MIT license, build-window history and dependency/AI attribution in JokerFuFu/agentproof-monad |
| Working product | Public app independently verifies a real Monad Testnet Accepted receipt without a wallet |
| Technical video | Actual 63.88-second Monad read-only walkthrough; link saved, anonymously accessible as video/mp4 |
| Separate Pitch | Actual 63.88-second subtitle-only Pitch; link saved, anonymously accessible as video/mp4 |
| Judge access | Exact public proof-package URL and import/read-only/verify/tamper/restore/export instructions saved |
| Testnet evidence | Chain 10143 registry, successful deployment/registration/publication/review, expected runtime and live Accepted status verified |
| Platform confirmation | HTTP 200 save and independent read; 5/5 required groups; dashboard All steps complete |

## Validation and permissions

The latest code checks passed **21/21 tests**, both Solidity targets compiled and Vite 7.3.7 built. The actual user-exported package and fresh command-line verification matched the live Monad registry. The public browser recording demonstrated unverified import, actual RPC verification, tamper failure, restoration, export and re-import. Both Release assets and both Pages MP4s downloaded anonymously with matching SHA-256 values. See [validation.md](validation.md) and [recorded-videos.md](recorded-videos.md).

The owner expressly authorized public MIT source, free GitHub Pages and both public videos, confirmed rights to open source the work, and later authorized direct contest submission. Existing approved profile and identity were reused. Contact email, request tokens, account identifiers, customer material and raw authenticated responses are excluded from the public confirmation record. Full authenticated save/read responses and the dashboard screenshot are retained in the private handoff.

The server's current standing result is a platform checkpoint, not a prediction of winning. The complete rules and linked [Foundation Terms](https://monad.xyz/terms-of-service) and [Privacy Policy](https://monad.xyz/privacy-policy) govern personal eligibility and any later verification. No new eligibility attestation or policy acceptance was made while saving the entry. Historical notes retain their original checkpoint status; the complete save above supersedes earlier pending-submission statements.
