# Recorded Monad technical demo and separate Pitch

## Current recordings — 10 October 2026

Both videos are **63.88 seconds**, H.264 MP4, 1440×1040, encoded at 25 fps, with explanatory subtitles and no audio. They use a continuous 140-second Playwright recording of the actual public app, edited to remove setup and idle intervals. Wallet deployment, publication and acceptance were completed by the entrant before recording; no new wallet signing is shown.

The actual flow is: run the deterministic synthetic checklist, import the package as unverified, connect read-only to the official Monad RPC, verify live Accepted status, expand chain evidence, detect changed output, restore and verify again, export, then import and independently reverify. The browser download produced a 2,586-byte JSON file whose manifest matches the entrant's exported package. Hashes establish content integrity; they do not establish AI accuracy or distinct human reviewers.

| Video | Browser-playable public MP4 | SHA-256 |
|---|---|---|
| Technical demonstration | [agentproof-monad-demo.mp4](https://jokerfufu.github.io/agentproof-monad/agentproof-monad-demo.mp4) | `74e1311476dfbe515caca40171213815078b9b2fb0a6582240cbbe7d08e4793c` |
| Separate project Pitch | [agentproof-monad-pitch.mp4](https://jokerfufu.github.io/agentproof-monad/agentproof-monad-pitch.mp4) | `19a67ce0996623b420f6bb16b2e1dd4c88c33c6dbcd3c9a04d4ec14990c390c9` |

The same files are confirmed public in [Release v0.1.2-monad](https://github.com/JokerFuFu/agentproof-monad/releases/tag/v0.1.2-monad). Anonymous downloads of both Release assets and both Pages MP4s returned HTTP 200 and matching hashes. Pages serves `video/mp4`; Release downloads use attachment disposition. Each duration is below its separate 3-minute technical and 2-minute Pitch limit.

The Pitch uses the real product footage with separate captions about the problem, solo builder, product, Monad integration and planned opt-in pilot. No voice or likeness is synthesized; no existing customers, revenue, throughput or cost benchmark is claimed.

Raw recording hash, retained segment ranges, exact captions, output probes and verification details are in [monad-recording-manifest.json](../../evidence/monad-recording-manifest.json). Chain coordinates and successful deployment/registration/publication/review transactions are in [monad-acceptance.json](../../evidence/monad-acceptance.json). The explorer link was present in the app, but a separate explorer-page navigation timed out; that unsuccessful navigation was omitted from the edited videos. The official RPC independently verified the contract and transactions. The videos do not imply that an explorer page loaded.

**Final contest submission remains pending.** Public hosting does not establish that the platform has saved or submitted these links.

## Historical local recordings — 9 October 2026

9 October 2026. Two distinct actual subtitle-only videos were produced. Each is 64 seconds, below the separate 3-minute technical and 2-minute Pitch limits. The local walkthrough is **not the final required Monad technical demo**: chain 31337 is a disposable local EVM, and no Monad deployment or transaction has happened.

The footage comes from actual native Chrome captures at approximately 1 fps, edited to remove pauses between operations. Captions were added and browser chrome cropped. Encoded frame repetition does not make it a continuous high-frame-rate recording. No voice or likeness was synthesized. All segments disclose Local EVM / Not Monad / Testnet deployment pending.

The exact captions are in [video-captions.json](video-captions.json). Capture timestamps, individual frame hashes and encoded output hashes are in [recording-manifest.json](../../evidence/recording-manifest.json). Original high-resolution captures and local MP4s are retained in the private task handoff.

[Public prototype Release](https://github.com/JokerFuFu/agentproof-monad/releases/tag/v0.1.1-prototype) is confirmed published, with two uploaded video/mp4 assets and matching SHA-256 digests:

| Video | Confirmed public asset | Encoding |
|---|---|---|
| Local prototype walkthrough | [agentproof-prototype.mp4](https://github.com/JokerFuFu/agentproof-monad/releases/download/v0.1.1-prototype/agentproof-prototype.mp4) | 64 s, H.264, 1920×1440, encoded 25 fps |
| Separate project Pitch | [agentproof-pitch-compact.mp4](https://github.com/JokerFuFu/agentproof-monad/releases/download/v0.1.1-prototype/agentproof-pitch-compact.mp4) | 64 s, H.264, 1280×960, encoded 1 fps |

The original larger Pitch remains in the local handoff. GitHub initially returned HTTP 408 and client retry timeouts; subsequent metadata confirmed the complete prototype and compact Pitch uploads. A client timeout alone was not treated as publication success. The Release is a prerelease, not a completed hackathon submission.

At that earlier checkpoint, actual Monad deployment, publisher/reviewer transactions and a new Testnet demonstration remained pending. The entrant subsequently completed those transactions on 10 October, and the current recordings and live verification above supersede that historical checkpoint.
