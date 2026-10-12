const receiptIcon=`<svg viewBox="0 0 32 36" fill="none" aria-hidden="true"><path d="M6 2h15l5 5v27l-5-3-5 3-5-3-5 3V2Z" stroke="currentColor" stroke-width="2"/><path d="M20 2v7h6M11 14h10M11 19h6M11 24h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;

export const workspaceView=`
<a class="skipLink" href="#sourcePanel">Skip to delivery workspace</a>
<header class="appHeader">
  <a class="brand" href="./" aria-label="AgentProof home">${receiptIcon}<span>AgentProof</span></a>
  <span class="workspaceName">Delivery workspace</span>
  <span class="network" id="network">Artifact checks / no chain</span>
</header>
<main>
  <section class="intro" aria-labelledby="pageTitle">
    <div><h1 id="pageTitle">Know what arrived.<br>Keep the proof.</h1><p>Inspect an agent’s delivery, check that its contents match,<br class="desktopBreak"> and look up the designated reviewer’s decision.</p></div>
    <div class="startHere"><button id="loadExample" class="primary exampleButton">Load Monad example <span aria-hidden="true">↗</span></button><p>Existing Testnet receipt. Fresh read-only verification.<br>No wallet needed.</p><a href="#sourcePanel">Or create a synthetic delivery below</a></div>
  </section>
  <nav class="workflow" aria-label="Delivery workflow">
    <a href="#sourcePanel" id="stepPrepare"><span>1</span><div><b>Prepare</b><small>Source & checking rules</small></div></a>
    <a href="#deliveryPanel" id="stepInspect"><span>2</span><div><b>Inspect</b><small>Delivery & version changes</small></div></a>
    <a href="#receiptPanel" id="stepVerify"><span>3</span><div><b>Verify</b><small>Contents & live chain</small></div></a>
    <a href="#reviewPanel" id="stepReview"><span>4</span><div><b>Review</b><small>Designated wallet decision</small></div></a>
  </nav>
  <div id="notice" class="notice" role="status" aria-live="polite">Start with the Monad example, or run the synthetic checklist. The checking rules use no LLM.</div>
  <section id="transactionPanel" class="transactionPanel" aria-labelledby="transactionTitle" hidden>
    <div><h2 id="transactionTitle">Transaction recovery</h2><p id="transactionText"></p><code id="transactionHash"></code><p class="caption" id="transactionStorage"></p></div>
    <div class="transactionActions"><button id="recover" class="primary">Recover transaction status</button><button id="copyTransaction">Save recovery record</button></div>
  </section>
  <div class="workbench">
    <div class="documents">
      <section id="sourcePanel" class="panel sourcePanel" aria-labelledby="sourceTitle">
        <div class="sectionTop"><div><span class="sectionNumber">1 / Prepare</span><h2 id="sourceTitle">Source & checking rules</h2></div><span class="subtleBadge">Local artifacts</span></div>
        <label for="source">Source brief</label><textarea id="source" spellcheck="false" aria-describedby="sourceHelp"></textarea>
        <p id="sourceHelp" class="caption">A synthetic brief for testing. The sample rules check for literal dates, timezones and deliverable keywords.</p>
        <div class="runRow"><button id="run" class="primary">Run checking agent</button><button id="restoreSource" disabled>Restore committed source</button></div>
        <div class="ruleNote"><span aria-hidden="true">⌁</span><p><b>Deterministic checklist v1</b><br>Presence rules only. No LLM, no external model request, no eligibility assessment.</p></div>
        <div class="checksTop"><h3>Requirement checks</h3><span id="checkSummary">Not run yet</span></div>
        <div id="checks" class="checks"><p class="emptyState">Run the checking agent to see exact source matches and missing fields.</p></div>
        <details class="policyDetails"><summary>Read the checking policy</summary><p id="policyText">Detect an explicit date, timezone, demo, code link and write-up. Return exact matched source text and mark missing items. Presence checks do not assess the meaning of a clause.</p></details>
      </section>
      <section id="deliveryPanel" class="panel deliveryPanel" aria-labelledby="deliveryTitle">
        <div class="sectionTop"><div><span class="sectionNumber">2 / Inspect</span><h2 id="deliveryTitle">Delivery artifact</h2></div><span class="subtleBadge" id="versionBadge">No delivery yet</span></div>
        <div class="editorTabs" role="tablist" aria-label="Delivery view"><button id="deliveryTab" role="tab" aria-selected="true" aria-controls="deliveryEditor">Edit delivery</button><button id="compare" role="tab" aria-selected="false" aria-controls="comparePanel" disabled>Compare versions</button></div>
        <div id="deliveryEditor" role="tabpanel" aria-labelledby="deliveryTab"><label for="output">Current delivery text</label><textarea id="output" spellcheck="false" placeholder="Run the checking agent or import a proof package to inspect a delivery."></textarea></div>
        <div id="comparePanel" role="tabpanel" aria-labelledby="compare" hidden><p id="diffSummary" class="caption">Create a delivery before comparing versions.</p><div class="versionGrid"><div><h3>Committed original</h3><pre id="originalVersion"></pre></div><div><h3>Current text</h3><pre id="currentVersion"></pre></div></div></div>
        <div class="artifactActions"><button id="tamper" disabled>Try a tampered delivery</button><button id="restore" disabled>Restore original</button></div>
        <p class="caption">Edits change the text under inspection. The committed original stays available for comparison and export.</p>
      </section>
    </div>
    <aside id="receiptPanel" class="panel receiptPanel" aria-labelledby="receiptTitle">
      <div class="receiptHeader"><div class="receiptIcon">${receiptIcon}</div><div><span class="sectionNumber">3 / Verify</span><h2 id="receiptTitle">Delivery receipt</h2></div></div>
      <p id="receiptState" class="receiptState">Awaiting a delivery</p><p class="caption" id="receiptCaption">Create or load a delivery to inspect its three independent states.</p>
      <div class="statusLayers" aria-label="Independent verification states" aria-live="polite">
        <div id="integrityLayer" class="statusLayer"><span class="layerMark" aria-hidden="true">≡</span><div><h3>Content integrity</h3><b id="integrityState">Not checked</b><p id="integrityHint">Do the exact source, output and policy match?</p></div></div>
        <div id="anchorLayer" class="statusLayer"><span class="layerMark" aria-hidden="true">◇</span><div><h3>Chain anchor</h3><b id="anchorState">Not anchored</b><p id="anchorHint">Is this package linked to a live registry receipt?</p></div></div>
        <div id="reviewLayer" class="statusLayer"><span class="layerMark" aria-hidden="true">◎</span><div><h3>Reviewer decision</h3><b id="reviewState">Not recorded</b><p id="decisionHint">What did the designated reviewer decide?</p></div></div>
      </div>
      <button id="verify" class="primary fullWidth" disabled>Verify delivery</button><div id="verificationResult" class="verificationResult" role="status" aria-live="polite">No delivery to verify yet.</div>
      <p class="trustBoundary">Matching commitments prove unchanged contents. They do not prove factual accuracy or an independent reviewer.</p>
      <details id="hashDetails"><summary>Artifact commitments</summary><dl id="hashes"><p class="caption">Commitments appear after you create or import a delivery.</p></dl></details>
      <details id="chainDetails"><summary>Chain evidence & coordinates</summary><dl id="chainEvidence"><p class="caption">No publication coordinates in this workspace.</p></dl></details>
      <section id="reviewPanel" class="reviewPanel" aria-labelledby="reviewTitle"><div class="reviewHeading"><span class="sectionNumber">4 / Review</span><h3 id="reviewTitle">Record a decision</h3></div><p class="caption" id="reviewHint">Connect the designated reviewer’s wallet after live verification. Publishing requires a different wallet.</p><div class="reviewRow"><button id="accept" disabled>Accept as reviewer</button><button id="reject" disabled>Reject as reviewer</button></div><button id="revoke" class="textButton dangerText" disabled>Revoke as publisher</button></section>
      <div class="packageActions"><button id="export" disabled>Export proof package</button><label class="import" for="import">Import JSON package<input type="file" id="import" accept=".json,application/json"></label></div><p class="caption packagePrivacy">A proof package contains the original source, output and salt. Share it only with people who may read those contents.</p>
    </aside>
  </div>
  <details id="connectionSettings" class="connectionSettings">
    <summary><span>Network & publishing</span><span id="connectionSummary">Artifact checks, no wallet</span></summary>
    <section class="connection" aria-label="Network connection"><div class="switch" aria-label="Connection mode"><button id="artifact" aria-pressed="true">Artifact checks</button><button id="local" aria-pressed="false">Local EVM demo</button><button id="monad" aria-pressed="false">Monad Testnet</button></div><p id="connectionText">Run, verify and export without a wallet.</p><button id="connect" hidden>Connect local demo</button></section>
    <section id="monadSettings" class="settings" hidden><p>Read-only verification uses an existing registry. Publishing, deployment and review open your test wallet for approval and use test MON for gas.</p><div class="settingsGrid"><label for="address">Registry address<input id="address" placeholder="0x… existing registry"></label><button id="readonly">Connect read-only</button><label for="reviewer">Designated reviewer wallet<input id="reviewer" placeholder="0x… different from publisher"></label><button id="deploy" disabled>Deploy registry with wallet</button></div><p class="caption">No private keys are requested. Wallet addresses, commitments and transactions are public on Testnet.</p></section>
    <div class="publishingRow"><div><h3>Publish this delivery</h3><p class="caption" id="publishHint">Connect a publisher to anchor a new delivery. Existing imported receipts cannot be republished.</p></div><button id="publish" class="primary" disabled>Publish receipt</button></div>
  </details>
  <details id="packageDetails" class="backupPanel" hidden><summary>Proof package · copy backup</summary><label for="packageText">Original proof package JSON</label><textarea id="packageText" readonly spellcheck="false"></textarea></details>
  <details id="deploymentDetails" class="backupPanel" hidden><summary>Confirmed Testnet deployment · copy backup</summary><label for="deploymentText">Public deployment evidence JSON</label><textarea id="deploymentText" readonly spellcheck="false"></textarea></details>
  <footer><span>AgentProof <span class="footerDivider">/</span> Monad Testnet prototype</span><span>Portable commitments. A designated reviewer’s decision.</span><a href="./LICENSE.txt">MIT license</a></footer>
</main>`;
