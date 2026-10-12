# AgentProof cyberpunk workspace polish

The user explicitly requested another visual/interaction pass, with Monad-themed cartoon elements and a cyberpunk direction, and delegated design details. Continue on `candidate/reliability-ui` from `4965afc`; preserve all established transaction, integrity and live-verification behavior. No new branch, original develop edits, pushes, merges, public deployment, competition changes or wallet transactions.

## Direction

Use a mature violet-black instrument workspace. Canvas `#0b0712`, panel `#171120`, raised surface `#21172e`, primary lavender `#bca1ff`, readable foreground `#f3edf9`, secondary `#b4a8c5`, and verified mint `#83e6c9`. Attention and mismatch keep distinct amber and rose cues. Primary actions use dark text on bright lavender; key text never depends on glow. Avenir/system sans carries body copy; system mono is reserved for literal proof data.

The hero combines direct product copy and the existing wallet-free example action with a single original geometric cartoon called the proof courier. It has a purple compact robot body, a friendly dark visor and an unstamped paper receipt. Author it as a repo-native SVG, which matches the existing vector graphics and stays crisp on mobile. The character is original AgentProof art, not an official Monad mascot. No official character assets are used, so no third-party character license or affiliation is implied. Decorative graphics contain no Accepted/Verified labels or invented live data.

Keep generous spacing, restrained borders, a small circuit-grid detail confined to the illustration, and deliberate panel hierarchy. The receipt inspector has three visibly independent instrument rows driven by the existing real state attributes. The original rules still clearly state no LLM. Mobile stacks content without overflow, retains comfortable hit targets, and gives the original art a compact presence.

## Interaction

Add a concise native-dialog guide explaining the three states and offering the existing read-only example. Escape closes it, first/last enabled controls explicitly wrap Tab/Shift+Tab focus while open, and closing returns focus to its opener. The guide's example action reflects the existing action's busy/disabled state. Existing labels and IDs remain compatible with core UI regressions.

Only the decorative courier uses a gentle small floating motion. Button responses are brief; no fake loading data, blinking transaction status, excessive glow or moving text. `prefers-reduced-motion: reduce` disables decorative animation, transitions and smooth scrolling. All controls retain strong visible focus; color is supplemented by explicit status text.

## Execution and evidence

1. Add `public/proof-courier.svg`, a focused `src/experience.mjs` guide module, and update `src/view.mjs`/`src/style.css`/page theme metadata.
2. Keep `chain.mjs`, `transactions.mjs`, `anchor.mjs`, `proof.mjs`, contract and proof fixture unchanged. Run the established unit suite, build and full browser regression.
3. Extend the isolated Chrome acceptance script for modal/keyboard reachability, decorative asset loading, contrast checks, and reduced-motion behavior. Inspect desktop and mobile screenshots and refine once if needed.
4. Save fresh screenshots under `deliverables/cyberpunk/`, create new Library image items, preserve prior deliverables and record exact returned IDs. Commit the local iteration and deliver the visual delta, real validation evidence and any actual limitations.
