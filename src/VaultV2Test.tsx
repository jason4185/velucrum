import React, { useState } from 'react';
import { ethers } from 'ethers';
import { getFhevmInstance, encryptUint64 } from './fhevm';

const VAULT_V2 = '0xa50fCd0393Ec09A1b84FAd4EDc8ED0911C59D828';
const CUSDT_MOCK = '0x4E7B06D78965594eB5EF5414c357ca21E1554491';
const UNDERLYING_USDT = '0xa7dA08FafDC9097Cc0E7D4f113A61e31d7e8e9b0';

const VAULT_V2_ABI = [
  "function claimTestUSDT() external",
  "function wrapToCUSDT(uint256 amount) external",
  "function deposit(uint256 encryptedAmount, uint8 pool, uint256 plainAmount) external",
  "function claimTestUSDT() external",
  "function wrapToCUSDT(uint256 amount) external",
  "function getUserDeposited(address a) external view returns (uint256)",
  "function holderCount() external view returns (uint256)",
  "function isHolder(address a) external view returns (bool)",
];

const UNDERLYING_ABI = [
  "function balanceOf(address) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
];

const WRAPPER_ABI = [
  "function setOperator(address operator, uint48 validUntil) external",
  "function isOperator(address holder, address spender) external view returns (bool)",
  "function wrap(address to, uint256 amount) external",
];

interface Props { signer: any; address: string; }

const css = `
  .v2-container { max-width: 700px; margin: 0 auto; padding: 32px; }
  .v2-title { font-family: 'Playfair Display', serif; font-size: 28px; color: #f0ede8; margin-bottom: 8px; }
  .v2-subtitle { font-size: 12px; color: #5a5750; font-family: 'JetBrains Mono', monospace; margin-bottom: 32px; }
  .v2-card { background: #111114; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 24px; margin-bottom: 16px; }
  .v2-card-title { font-size: 14px; font-weight: 600; color: #f0ede8; margin-bottom: 4px; }
  .v2-card-sub { font-size: 12px; color: #5a5750; margin-bottom: 16px; }
  .v2-btn { background: #f5a623; color: #0a0a0b; font-size: 12px; font-weight: 700; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; margin-right: 8px; margin-top: 8px; transition: all 0.2s; }
  .v2-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(245,166,35,0.25); }
  .v2-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
  .v2-btn-green { background: rgba(34,197,94,0.12); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); font-size: 12px; font-weight: 600; padding: 10px 20px; border-radius: 8px; cursor: pointer; margin-right: 8px; margin-top: 8px; transition: all 0.2s; }
  .v2-btn-green:hover { background: rgba(34,197,94,0.2); }
  .v2-input { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 10px 14px; color: #f0ede8; font-size: 14px; outline: none; width: 200px; margin-right: 8px; }
  .v2-msg { background: rgba(245,166,35,0.08); border: 1px solid rgba(245,166,35,0.2); border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #f5a623; margin-bottom: 16px; font-family: 'JetBrains Mono', monospace; word-break: break-all; }
  .v2-badge { display: inline-block; background: rgba(239,68,68,0.12); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); font-size: 9px; font-family: 'JetBrains Mono', monospace; padding: 3px 8px; border-radius: 4px; letter-spacing: 0.1em; margin-left: 8px; }
  .v2-step { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #f5a623; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 6px; opacity: 0.7; }
`;

export default function VaultV2Test({ signer, address }: Props) {
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState('');
  const [wrapAmt, setWrapAmt] = useState('1000');
  const [depositAmt, setDepositAmt] = useState('500');
  const [underlyingBal, setUnderlyingBal] = useState<string | null>(null);
  const [isOperator, setIsOperator] = useState<boolean | null>(null);
  const [isHolderV2, setIsHolderV2] = useState<boolean | null>(null);

  const getContracts = () => {
    const vaultV2 = new ethers.Contract(VAULT_V2, VAULT_V2_ABI, signer);
    const underlying = new ethers.Contract(UNDERLYING_USDT, UNDERLYING_ABI, signer);
    const wrapper = new ethers.Contract(CUSDT_MOCK, WRAPPER_ABI, signer);
    return { vaultV2, underlying, wrapper };
  };

  const checkStatus = async () => {
    try {
      const { underlying, wrapper, vaultV2 } = getContracts();
      const bal = await underlying.balanceOf(address);
      setUnderlyingBal((Number(bal) / 1e6).toFixed(2));
      const op = await wrapper.isOperator(address, VAULT_V2);
      setIsOperator(op);
      const holder = await vaultV2.isHolder(address);
      setIsHolderV2(holder);
    } catch (e: any) { setMsg('Status check error: ' + e.message); }
  };

  const claimUSDT = async () => {
    setLoading('claim'); setMsg('');
    try {
      const { vaultV2 } = getContracts();
      const tx = await vaultV2.claimTestUSDT();
      await tx.wait();
      setMsg('✅ Claimed 10,000 underlying USDT!');
      await checkStatus();
    } catch (e: any) { setMsg('Error: ' + e.message); }
    setLoading('');
  };

  const setVaultAsOperator = async () => {
    setLoading('operator'); setMsg('');
    try {
      const { wrapper } = getContracts();
      const validUntil = Math.floor(Date.now() / 1000) + 86400;
      const tx = await wrapper.setOperator(VAULT_V2, validUntil);
      await tx.wait();
      setMsg('✅ Vault V2 set as operator! Valid for 24 hours.');
      setIsOperator(true);
    } catch (e: any) { setMsg('Error: ' + e.message); }
    setLoading('');
  };

  const wrapUSDT = async () => {
    setLoading('wrap'); setMsg('');
    try {
      const { underlying, wrapper } = getContracts();
      const amount = BigInt(Math.floor(parseFloat(wrapAmt) * 1e6));
      setMsg('Step 1/2 — Approving underlying USDT...');
      const approveTx = await underlying.approve(CUSDT_MOCK, ethers.MaxUint256);
      await approveTx.wait();
      setMsg('Step 2/2 — Wrapping to confidential cUSDT...');
      const wrapTx = await wrapper.wrap(address, amount);
      await wrapTx.wait();
      setMsg(`✅ Wrapped ${wrapAmt} USDT to confidential cUSDT! Amount invisible on Etherscan.`);
      await checkStatus();
    } catch (e: any) { setMsg('Error: ' + e.message); }
    setLoading('');
  };

  const depositV2 = async () => {
    setLoading('deposit'); setMsg('');
    try {
      const amount = Math.floor(parseFloat(depositAmt) * 1e6);

      // Encode pool and plainAmount as callback data for vault
      const callbackData = ethers.AbiCoder.defaultAbiCoder().encode(
        ['uint8', 'uint256'],
        [1, amount]
      );

      // Encrypt the amount using Zama SDK
      setMsg('Encrypting amount with Zama FHEVM...');
      const encrypted = await encryptUint64(amount, CUSDT_MOCK, address);

      // Call cUSDT directly — transfers to vault AND triggers onTransferReceived
      const cusdt = new ethers.Contract(CUSDT_MOCK, [
        "function confidentialTransferAndCall(address to, bytes32 encryptedAmount, bytes calldata inputProof, bytes calldata callbackData) external"
      ], signer);

      setMsg('Sending confidential transfer to vault...');
      const tx = await cusdt.confidentialTransferAndCall(
        VAULT_V2,
        encrypted.handle,
        encrypted.proof,
        callbackData
      );
      await tx.wait();
      setMsg(`✅ Deposited ${depositAmt} cUSDT into V2 vault! Amount invisible on Etherscan.`);
      setIsHolderV2(true);
      await checkStatus();
    } catch (e: any) { setMsg('Error: ' + e.message); }
    setLoading('');
  };

  return (
    <div className="v2-container">
      <style>{css}</style>
      <div className="v2-title">VelucumVault V2 Test <span className="v2-badge">EXPERIMENTAL</span></div>
      <div className="v2-subtitle">Testing Zama fhERC20 confidential token integration — not production</div>

      {msg && <div className="v2-msg">{msg}</div>}

      <div className="v2-card">
        <div className="v2-step">Status Check</div>
        <div className="v2-card-title">Check your V2 status</div>
        <div className="v2-card-sub">Underlying USDT: {underlyingBal !== null ? underlyingBal + ' USDT' : '—'} | Vault Operator: {isOperator !== null ? (isOperator ? '✅' : '❌') : '—'} | V2 Holder: {isHolderV2 !== null ? (isHolderV2 ? '✅' : '❌') : '—'}</div>
        <button onClick={checkStatus} className="v2-btn-green">Refresh Status</button>
      </div>

      <div className="v2-card">
        <div className="v2-step">Step 1</div>
        <div className="v2-card-title">Claim Test USDT</div>
        <div className="v2-card-sub">Mint 10,000 underlying USDT from Zama's public faucet.</div>
        <button onClick={claimUSDT} disabled={loading === 'claim'} className="v2-btn">
          {loading === 'claim' ? 'Claiming...' : 'Claim 10,000 Test USDT'}
        </button>
      </div>



      <div className="v2-card">
        <div className="v2-step">Step 3</div>
        <div className="v2-card-title">Wrap USDT → Confidential cUSDT</div>
        <div className="v2-card-sub">Convert plain USDT to Zama's fhERC20 confidential token. Amount will be invisible on Etherscan.</div>
        <input value={wrapAmt} onChange={e => setWrapAmt(e.target.value)} className="v2-input" placeholder="1000" />
        <button onClick={wrapUSDT} disabled={loading === 'wrap' || !wrapAmt} className="v2-btn">
          {loading === 'wrap' ? 'Wrapping...' : 'Wrap to cUSDT'}
        </button>
      </div>

      <div className="v2-card">
        <div className="v2-step">Step 4</div>
        <div className="v2-card-title">Deposit Confidential cUSDT into V2 Vault</div>
        <div className="v2-card-sub">Deposit encrypted using Zama FHEVM. Amount encrypted in browser before leaving. Fully private on Etherscan.</div>
        <input value={depositAmt} onChange={e => setDepositAmt(e.target.value)} className="v2-input" placeholder="500" />
        <button onClick={depositV2} disabled={loading === 'deposit' || !depositAmt} className="v2-btn">
          {loading === 'deposit' ? 'Depositing...' : 'Deposit to V2 Vault'}
        </button>
      </div>

      <div className="v2-card">
        <div className="v2-step">V2 Contract</div>
        <div className="v2-card-title">Deployed Addresses</div>
        <div className="v2-card-sub" style={{fontFamily: 'JetBrains Mono', fontSize: 11}}>
          VaultV2: {VAULT_V2}<br/>
          cUSDTMock: {CUSDT_MOCK}<br/>
          Underlying USDT: {UNDERLYING_USDT}
        </div>
      </div>
    </div>
  );
}
