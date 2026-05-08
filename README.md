# Velucrum

**Confidential Yield Vault — Deposit. Earn. Borrow. All encrypted.**

Velucrum is a privacy-first DeFi vault where your balance, yield, and borrowing power are fully encrypted on-chain. This repository contains the web application that connects to the Velucrum smart contracts on Sepolia testnet.

---

## Live Demo

https://velucrum.vercel.app

---

## Tech Stack

- React 18 and TypeScript
- ethers.js v6
- @zama-fhe/relayer-sdk v0.4.2
- Tailwind CSS

---

## Getting Started

Clone the repository and install dependencies.

    git clone <repo-url>
    cd velucrum
    npm install

Create a .env file in the root directory.

    REACT_APP_VAULT_ADDRESS=0x0a3725651Be62CBeA893c5DFf45F3BFEe49c2e91
    REACT_APP_YIELD_SOURCE_ADDRESS=0x38f2bB97EE9e3fa2E279FF5FC7cD6Ec6a20BB306
    REACT_APP_CUSDT_ADDRESS=0xEd0C55690776FA2C5214dc5A4F0A2450627f5Ca0

Start the application.

    npm start

Connect a wallet to Sepolia testnet before using the app. You will need Sepolia ETH for gas. Use the in-app faucet to get test cUSDT.

---

## Application Overview

### Markets

A live overview of the protocol. Shows the number of active depositors, total vault size in cUSDT, pending yield accruing across the pool, and current utilization rate. Three yield pools are available — Safe and Steady at 7.4% APY, Balanced Returns at 11.8% APY, and High Yield at 18.6% APY.

### Vault Manager

Use the Faucet to get 10,000 test cUSDT. Use Deposit to encrypt your amount in the browser and submit it to the vault with a cryptographic proof. Use Harvest to collect your accrued yield into your encrypted balance. Use Auto-Compound to re-deposit your yield so it earns yield on top of yield.

### My Position

The Status card shows whether you are an active depositor and your loan status. Click Reveal My Balance to sign a message with your wallet — the Zama Key Management System decrypts your balance and yield exclusively for you. Nobody else can trigger this.

The Withdraw card lets you exit the vault and receive cUSDT to your wallet. You must repay any active loan first. The Blind Lending card lets you borrow up to 70% of your vault balance without revealing what that balance is. You can reveal your loan amount privately and repay from this tab.

---

## How Balance Reveal Works

The app generates a temporary keypair and creates an EIP712 signing request. You sign it with your wallet. The signature and your encrypted balance handle are sent to the Zama KMS. The KMS verifies that the signature matches the wallet that owns the encrypted value and decrypts it only for your browser session. The decrypted number is never stored anywhere. Nobody else can trigger this process — the signature is wallet-specific and time-limited.

---

## How Deposit Privacy Works

When you deposit, your amount is encrypted in the browser before being sent to the blockchain. The contract stores your balance as an encrypted integer that nobody can read on-chain. A plain amount is also sent for the ERC20 transfer, which means the deposit amount is visible on Etherscan today.

Once your funds are inside the vault, everything that happens to them is fully encrypted. Your yield, your loan, your compounding activity — none of it is readable by anyone except you.

---

## How Blind Lending Works

You enter a loan amount and click Open Blind Loan. The amount is FHE-encrypted in the browser. The contract checks your collateral entirely in encrypted space using FHE.mul and FHE.le. Your balance is never decrypted during this process. If you are within the 70% limit, the loan is approved. Your loan amount is stored encrypted and only you can reveal it.

---

## Known Limitations

Deposit and withdrawal amounts are visible on Etherscan because MockCUSDT is a standard ERC20 token. Only one active loan is allowed per wallet at a time.

---

## Smart Contracts

The Velucrum smart contracts are in a separate repository at https://github.com/jason4185/velucrum-contracts. Contract addresses for Sepolia and deployment instructions are documented there.

## Why We Used MockCUSDT

Velucrum was designed to use Zama's official confidential USDT (cUSDTMock) on Sepolia so that deposit and withdrawal amounts would be fully invisible on Etherscan. During development we successfully minted underlying USDT from Zama's faucet, wrapped it to confidential cUSDT, and built a vault that implements the ERC7984 receiver interface.

The integration was blocked by a fundamental requirement of the ERC7984 standard — confidentialTransferAndCall does not accept a fresh encrypted input proof. It requires an existing ACL-approved encrypted balance handle that was previously minted through the wrap process and registered in the FHE coprocessor. Creating this handle from a frontend wallet requires deeper Zama SDK integration that is not yet publicly documented.

This is why Velucrum uses MockCUSDT for testnet. The vault's FHE operations, encrypted balances, blind lending, and confidential yield all work correctly. Only the deposit and withdrawal amounts are visible on Etherscan.

In production, Velucrum will migrate to Zama's fhERC20 which is now live on Ethereum mainnet. Once the full confidential transfer flow is supported in the SDK, every deposit and withdrawal will be completely invisible on Etherscan — end to end privacy from the moment tokens enter the protocol.
