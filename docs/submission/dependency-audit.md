# Dependency audit — 9 October 2026

The initial pinned viem 2.38.5 production tree included vulnerable `ws`. viem was upgraded to **2.57.4** and the meaningful contract/proof tests were rerun: **12 passed, 0 failed** (2,291.8 ms). The static build succeeds with both Solidity targets (5.42 s). The [upstream ws advisory](https://github.com/advisories/GHSA-96hv-2xvq-fx4p) describes the affected WebSocket server memory-exhaustion issue.

The installed `npm ls --omit=dev --all --parseable` tree contains **13** production dependency distributions. Intersecting the exact package paths with npm's vulnerability-node paths yields **zero findings in that production tree** after the upgrade. This does not establish that all code is secure.

`npm audit --omit=dev --json` still reports **30** findings (1 low, 8 moderate, 17 high, 4 critical). Every reported node lies under `node_modules/ganache/node_modules/`; those bundled development packages are not in the 13-package production tree or the browser bundle. Do not describe the raw audit command as passing or the entire installed dependency tree as clean.

Ganache is retained only for synthetic, disposable local tests, bound to `127.0.0.1`, with no real funds or user keys. It is not a production backend. Replacing the legacy simulator and resolving its bundled development advisories remains separate work before any production use. Development-server and compiler dependency risks are likewise outside a formal security audit.

## Fresh full audit during the prototype recheck

Vite was upgraded from 7.1.9 to **7.3.7** after checking its [upstream development-server advisory](https://github.com/advisories/GHSA-p9ff-h696-f583). The new full `npm audit --json` reports **38** findings: 2 low, 8 moderate, 23 high and 5 critical. Vite is no longer an audit finding. The exact installed production-path intersection remains **13 distributions / zero reported findings**. Remaining development issues include Ganache and the compiler's `tmp` dependency; no all-dependencies-clean claim is made. jsdom 26.1.0 and esbuild 0.25.12 were added for the UI regression harness. No vulnerable development server is exposed publicly; Vite and the disposable chain bind to loopback.
