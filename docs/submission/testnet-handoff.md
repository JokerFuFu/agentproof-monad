# Monad Testnet demonstration handoff

This is a ready-to-run browser path. It has **not** yet been executed on Monad. The user controls the wallet and signs each transaction; the assistant never needs a seed phrase or private key.

## Prepare

1. Open the local workbench at `http://127.0.0.1:5187/` in a browser with the user's existing injected wallet. A public build can use the same flow after release.
2. Use two dedicated test-only accounts: publisher and reviewer. Separate addresses do not establish separate human identities.
3. Verify the network from the [official Testnet documentation](https://docs.monad.xyz/developer-essentials/testnet): chain **10143**, official RPC `https://testnet-rpc.monad.xyz`. Obtain only test MON through the [official faucet](https://faucet.monad.xyz/). Do not transfer real assets.
4. Select **Monad Testnet** in the app, enter the reviewer's public address, and choose **Connect Testnet wallet** with the publisher selected. Wallet account/network access and signatures stay under user control.

## Execute and retain evidence

| Action | User action | Expected evidence |
|---|---|---|
| Deploy registry | Approve the deployment in the wallet | Successful transaction, two confirmations, registry address and block |
| Run checking agent | Run the synthetic brief | Manifest input/output/policy commitments |
| Publish receipt | Approve agent registration, then receipt publication | Successful registration and publication; receipt ID and transaction |
| Verify | Compare unchanged artifact with live receipt | Pending review, verified commitments |
| Tamper / restore | Try a tampered delivery, verify, then restore | Mismatch, then unchanged artifact verifies |
| Review | Switch to designated review wallet, then Accept as reviewer | Successful review transaction and live Accepted status |
| Export / import | Save the package, import through file chooser, connect and re-verify | Imported state initially unverified; live check reconstructs Accepted |
| Optional revocation | Switch back to publisher, approve Revoke | Live verification invalid; original commitments retained |

The app checks the live selected account and network before writes, simulates each contract call, checks expected runtime bytecode and waits for confirmed successful receipts. Inspect the wallet's current estimate before signing. This flow consumes test MON for gas; no fixed gas-cost or speed claim is made.

Keep one accepted receipt for judges. Use a separate receipt for the revocation example. Save deployment, registration, publication and review transaction hashes plus the portable synthetic package. Public explorer links take the form `https://testnet.monadvision.com/tx/<actual-hash>`. Do not substitute local chain 31337 coordinates for Monad evidence.

## Before final submission

Verify the public site, code and both videos without a private login. Recheck the live deployed bytecode and receipt. Replace all pending statements and placeholders in the project text with confirmed evidence. Review the platform's actual final declarations at action time.
