# Technical demonstration and optional signing script

The current [public technical video](https://jokerfufu.github.io/agentproof-monad/agentproof-monad-demo.mp4) is **63.88 seconds**. It records actual wallet-free replay of the accepted Monad receipt: generation, unverified import, official-RPC verification, chain evidence, tamper detection, restored acceptance, export and fresh import/reverification. The entrant's deployment, publication and review transactions happened before recording; the video does not show new signatures. See [recorded-videos.md](recorded-videos.md) for hashes, editing details and the public Release.

The following 2:45 script is an optional future recording with user-controlled signatures, not a description of the published video.

Use synthetic input and test-only wallets. Record actual operation on Monad Testnet after successful deployment. Show a readable chain label and at least one explorer transaction. Do not present a local EVM recording as Monad integration.

| Time | Screen and action | Narration |
|---|---|---|
| 0:00–0:20 | Source and delivery workbench | “Agent outputs change hands. AgentProof links one exact delivery to its publisher, checking policy and review decision.” |
| 0:20–0:45 | Run the checking agent; highlight the missing timezone | “This synthetic checklist agent reports what is present and what is missing. It is deterministic. The receipt protocol also accepts other agents' text artifacts.” |
| 0:45–1:15 | Monad Testnet selected; publish using publisher wallet; show confirmation | “The browser creates salted commitments for input, output and policy. The registry records the agent, designated reviewer and review window. Raw documents stay in the local package.” |
| 1:15–1:35 | Open Chain evidence and explorer publication | “This is the confirmed Monad Testnet transaction and receipt. Verification checks the registry implementation, publication event and live state.” |
| 1:35–1:55 | Verify, tamper, verify failure, restore | “Original content matches. Change the delivery and the commitment fails. A valid hash still does not prove the content is correct.” |
| 1:55–2:20 | Switch to reviewer wallet, accept; verify status | “Only this designated reviewer may decide. Acceptance is a separate judgment, not a cryptographic proof of AI accuracy.” |
| 2:20–2:40 | Export/import package; verify again | “A package travels with the work. Imported identities and statuses are untrusted until checked against the live contract.” |
| 2:40–2:45 | Final receipt | “One delivery, a verifiable history, and an explicit reviewer.” |

Prepare deployment and wallet funding before recording. Do not cut away from transaction success in a way that implies an unconfirmed action completed. Use readable zoom, hide private account labels, and retain unedited confirmation evidence. If wallet approvals take longer, trim explanatory pauses rather than inventing confirmations. Maximum permitted video length is three minutes under the current signup rules.

## Recorded local walkthrough

A historical 64-second local EVM walkthrough covers generation, publication, designated-reviewer acceptance, changed-output detection, restoration and proof export. It records the earlier local prototype. The current Monad video and chain evidence above supersede the earlier pending-Testnet checkpoint. The current video link is saved in the independently verified complete contest entry; see [submission confirmation](../../evidence/metropolis-submission-confirmation.json).
