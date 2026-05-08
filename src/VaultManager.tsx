import React, { useState } from 'react';
import { getVault, getCUSDT } from './contract';
import { encryptUint64 } from './fhevm';

const VAULT_ADDRESS = process.env.REACT_APP_VAULT_ADDRESS!;

interface Props { address: string; signer: any; }

const css = `
  .vel-panel-label { font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 0.18em; color: #f5a623; text-transform: uppercase; margin-bottom: 20px; opacity: 0.8; }
  .vel-panel-title { font-family: 'Playfair Display', serif; font-size: 30px; font-weight: 700; font-style: italic; color: #f0ede8; letter-spacing: -0.5px; margin-bottom: 28px; }
  .vel-msg { background: #111114; border: 1px solid rgba(245,166,35,0.2); border-radius: 10px; padding: 14px 18px; font-size: 13px; font-weight: 300; color: #9e9b94; margin-bottom: 20px; }
  .vel-faucet { background: rgba(245,166,35,0.04); border: 1px dashed rgba(245,166,35,0.25); border-radius: 14px; padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .vel-faucet-tag { font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 0.18em; color: #f5a623; text-transform: uppercase; margin-bottom: 4px; opacity: 0.7; }
  .vel-faucet-title { font-size: 14px; font-weight: 600; color: #f0ede8; margin-bottom: 2px; }
  .vel-faucet-sub { font-size: 12px; font-weight: 300; color: #5a5750; }
  .vel-btn-faucet { font-family: 'Plus Jakarta Sans', sans-serif; background: rgba(245,166,35,0.1); border: 1px solid rgba(245,166,35,0.3); color: #f5a623; font-size: 12px; font-weight: 600; padding: 9px 20px; border-radius: 8px; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
  .vel-btn-faucet:hover { background: rgba(245,166,35,0.18); }
  .vel-btn-faucet:disabled { opacity: 0.4; cursor: not-allowed; }
  .vel-card { background: #111114; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 24px; margin-bottom: 16px; }
  .vel-card-num { font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 0.18em; color: #f5a623; text-transform: uppercase; margin-bottom: 6px; opacity: 0.6; }
  .vel-card-title { font-size: 16px; font-weight: 600; color: #f0ede8; margin-bottom: 4px; }
  .vel-card-sub { font-size: 12px; font-weight: 300; color: #5a5750; margin-bottom: 20px; line-height: 1.6; }
  .vel-field-label { font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 0.15em; color: #5a5750; text-transform: uppercase; margin-bottom: 7px; display: block; }
  .vel-input { width: 100%; background: #18181d; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 11px 14px; font-size: 13px; font-family: 'Plus Jakarta Sans', sans-serif; color: #f0ede8; outline: none; transition: border 0.2s; margin-bottom: 14px; }
  .vel-input:focus { border-color: rgba(245,166,35,0.4); box-shadow: 0 0 0 3px rgba(245,166,35,0.07); }
  .vel-input::placeholder { color: #2a2825; font-style: italic; font-weight: 300; }
  .vel-tranche-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 16px; }
  .vel-tranche-opt { padding: 12px 8px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.07); background: transparent; cursor: pointer; text-align: center; transition: all 0.2s; }
  .vel-tranche-opt:hover { border-color: rgba(245,166,35,0.4); background: rgba(245,166,35,0.06); transform: translateY(-2px); box-shadow: 0 4px 16px rgba(245,166,35,0.1); }
  .vel-t-name { font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; display: block; margin-bottom: 5px; }
  .vel-t-apy { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; display: block; }
  .vel-t-risk { font-size: 10px; font-weight: 300; margin-top: 3px; display: block; color: #5a5750; }
  .vel-btn-primary { font-family: 'Plus Jakarta Sans', sans-serif; background: #f5a623; color: #0a0a0b; font-size: 13px; font-weight: 700; padding: 11px 24px; border-radius: 10px; border: none; cursor: pointer; transition: all 0.2s ease; }
  .vel-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 0 20px rgba(245,166,35,0.25); }
  .vel-btn-primary:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }
  .vel-btn-green { font-family: 'Plus Jakarta Sans', sans-serif; background: rgba(34,197,94,0.12); color: #22c55e; font-size: 13px; font-weight: 600; padding: 11px 24px; border-radius: 10px; border: 1px solid rgba(34,197,94,0.25); cursor: pointer; transition: all 0.2s; }
  .vel-btn-green:hover { background: rgba(34,197,94,0.2); }
  .vel-btn-green:disabled { opacity: 0.35; cursor: not-allowed; }
  .vel-yield-info { display: flex; align-items: center; gap: 8px; background: rgba(34,197,94,0.04); border: 1px solid rgba(34,197,94,0.12); border-radius: 10px; padding: 10px 14px; margin-bottom: 14px; font-size: 12px; color: #5a5750; }
  @media (max-width: 900px) {
    .vel-tranche-grid { grid-template-columns: 1fr; gap: 6px; }
    .vel-faucet { flex-direction: column; align-items: flex-start; gap: 12px; }
    .vel-btn-faucet { width: 100%; text-align: center; }
    .vel-panel-title { font-size: 22px; }
    .vel-card { padding: 16px; }
    .vel-msg { font-size: 12px; word-break: break-word; }
  }
`;

const POOLS = [
  { value: 1, name: 'Safe & Steady', apy: '7.4%', risk: 'Very Low', color: '#22c55e' },
  { value: 2, name: 'Balanced', apy: '11.8%', risk: 'Medium', color: '#f5a623' },
  { value: 3, name: 'High Yield', apy: '18.6%', risk: 'Higher', color: '#ef4444' },
];

export default function VaultManager({ address, signer }: Props) {
  const [pool, setPool] = useState(1);
  const [depositAmt, setDepositAmt] = useState('');
  const [harvestAddr, setHarvestAddr] = useState(address);
  const [loading, setLoading] = useState('');
  const [msg, setMsg] = useState('');

  const selectedPool = POOLS.find(p => p.value === pool) || POOLS[0];

  const parseError = (e: any): string => {
    const msg = e?.message || '';
    if (e?.code === 4001 || msg.includes('user rejected') || msg.includes('User denied') || msg.includes('ACTION_REJECTED')) return 'Transaction rejected.';
    if (msg.includes('insufficient funds')) return 'Insufficient funds for gas.';
    if (msg.includes('execution reverted')) return 'Transaction reverted. Check your inputs.';
    if (msg.includes('network') || msg.includes('fetch')) return 'Network error. Please check your connection.';
    if (msg.includes('Repay loan first')) return 'You have an active loan. Please repay it before withdrawing.';
    if (msg.includes('Exceeds deposit')) return 'Amount exceeds your deposited balance.';
    return 'Something went wrong. Please try again.';
  };

  const getFaucet = async () => {
    try {
      setLoading('faucet'); setMsg('Requesting cUSDT from faucet...');
      const cusdt = getCUSDT(signer);
      await (await cusdt.faucet()).wait();
      setMsg('10,000 cUSDT sent to your wallet.');
    } catch (e: any) { setMsg(parseError(e)); }
    setLoading('');
  };

  const approveAndDeposit = async () => {
    try {
      setLoading('deposit');
      const plainAmt = Math.floor(Number(depositAmt) * 1e6);
      const cusdt = getCUSDT(signer);
      setMsg('Step 1/3 — Approving cUSDT spend...');
      await (await cusdt.approve(VAULT_ADDRESS, BigInt(plainAmt))).wait();
      setMsg('Step 2/3 — Encrypting amount with Zama FHEVM...');
      const enc = await encryptUint64(Math.floor(Number(depositAmt) * 1e6), VAULT_ADDRESS, address);
      setMsg('Step 3/3 — Sending deposit to Sepolia...');
      const vault = getVault(signer);
      await (await vault.deposit(enc.handle, enc.proof, pool, plainAmt)).wait();
      setMsg(`Deposited ${depositAmt} cUSDT into ${selectedPool.name} pool.`);
      setDepositAmt('1000');
    } catch (e: any) { const reason = e.reason || e.message || '';
      if (reason.includes('user rejected') || reason.includes('User denied') || reason.includes('ACTION_REJECTED') || e.code === 4001) {
        setMsg('Transaction cancelled.');
        setLoading('');
        return;
      } else if (reason.includes('transfer') || reason.includes('insufficient') || reason.includes('balance')) {
        setMsg('Insufficient cUSDT balance. Please get tokens from the faucet first.');
      } else if (reason.includes('Amount must') || reason.includes('Amount must be')) {
        setMsg('Please enter a valid amount greater than zero.');
      } else if (reason.includes('No yield')) {
        setMsg('No yield available yet. Wait a few blocks and try again.');
      } else if (reason.includes('No deposit')) {
        setMsg('You have no active deposit in the yield source.');
      } else if (reason.includes('Repay loan')) {
        setMsg('Please repay your active loan before withdrawing.');
      } else if (reason.includes('Exceeds deposit')) {
        setMsg('Withdrawal amount exceeds your deposited balance.');
      } else if (reason.includes('Loan already')) {
        setMsg('You already have an active loan. Please repay it first.');
      } else if (reason.includes('No active loan')) {
        setMsg('You have no active loan to repay.');
      } else if (reason.includes('Not a holder')) {
        setMsg('You need to make a deposit first.');
      } else if (reason.includes('Share too small')) {
        setMsg('Your yield share is too small to harvest yet. Wait a few more blocks.');
      } else {
        setMsg('Transaction failed: ' + reason);
      } }
    setLoading('');
  };

  const autoCompound = async () => {
    try {
      setLoading('compound');
      setMsg('Compounding your yield back into the vault...');
      const vault = getVault(signer);
      await (await vault.autoCompound(address)).wait();
      setMsg('Yield auto-compounded successfully. Your encrypted balance has grown silently.');
    } catch (e: any) {
      const reason = e.reason || e.message || '';
      if (reason.includes('user rejected') || reason.includes('ACTION_REJECTED')) {
        setMsg('Transaction cancelled.');
      } else if (reason.includes('Too soon')) {
        setMsg('Auto-compound is available every 100 blocks (~20 mins). Please wait a little longer.');
      } else if (reason.includes('No yield')) {
        setMsg('No yield available to compound yet. Wait a few more blocks.');
      } else {
        setMsg('Transaction failed: ' + reason);
      }
    }
    setLoading('');
  };

  const harvestYield = async () => {
    try {
      setLoading('harvest');
      setMsg('Harvesting accrued yield...');
      const vault = getVault(signer);
      await (await vault.harvestYield()).wait();
      setMsg('Yield harvested successfully. Your encrypted balance has been updated.');
      setHarvestAddr('');
    } catch (e: any) { const reason = e.reason || e.message || '';
      if (reason.includes('user rejected') || reason.includes('User denied') || reason.includes('ACTION_REJECTED') || e.code === 4001) {
        setMsg('Transaction cancelled.');
        setLoading('');
        return;
      } else if (reason.includes('transfer') || reason.includes('insufficient') || reason.includes('balance')) {
        setMsg('Insufficient cUSDT balance. Please get tokens from the faucet first.');
      } else if (reason.includes('Amount must') || reason.includes('Amount must be')) {
        setMsg('Please enter a valid amount greater than zero.');
      } else if (reason.includes('No yield')) {
        setMsg('No yield available yet. Wait a few blocks and try again.');
      } else if (reason.includes('No deposit')) {
        setMsg('You have no active deposit in the yield source.');
      } else if (reason.includes('Repay loan')) {
        setMsg('Please repay your active loan before withdrawing.');
      } else if (reason.includes('Exceeds deposit')) {
        setMsg('Withdrawal amount exceeds your deposited balance.');
      } else if (reason.includes('Loan already')) {
        setMsg('You already have an active loan. Please repay it first.');
      } else if (reason.includes('No active loan')) {
        setMsg('You have no active loan to repay.');
      } else if (reason.includes('Not a holder')) {
        setMsg('You need to make a deposit first.');
      } else if (reason.includes('Share too small')) {
        setMsg('Your yield share is too small to harvest yet. Wait a few more blocks.');
      } else {
        setMsg('Transaction failed: ' + reason);
      } }
    setLoading('');
  };

  return (
    <div>
      <style>{css}</style>
      <div className="vel-panel-label">Velucrum Protocol — Vault Manager</div>
      <div className="vel-panel-title">Deposit & Distribute</div>
      {msg && <div className="vel-msg">{msg}</div>}

      <div className="vel-faucet">
        <div>
          <div className="vel-faucet-tag">Test Tokens</div>
          <div className="vel-faucet-title">Get 10,000 cUSDT for free</div>
          <div className="vel-faucet-sub">Fund your wallet to test all features</div>
        </div>
        <button className="vel-btn-faucet" onClick={getFaucet} disabled={loading === 'faucet'}>
          {loading === 'faucet' ? 'Sending...' : 'Get 10,000 cUSDT'}
        </button>
      </div>

      <div className="vel-card">
        <div className="vel-card-num">01 — Deposit</div>
        <div className="vel-card-title">Deposit cUSDT into a yield pool</div>
        <div className="vel-card-sub">Choose your pool and enter amount. Your balance is encrypted before it leaves your browser.</div>
        <div className="vel-tranche-grid">
          {POOLS.map((p) => (
            <div key={p.value} className="vel-tranche-opt" onClick={() => setPool(p.value)}
              style={{
                borderColor: pool === p.value ? `${p.color}66` : 'rgba(255,255,255,0.07)',
                background: pool === p.value ? `${p.color}0d` : 'transparent'
              }}>
              <span className="vel-t-name" style={{ color: p.color }}>{p.name}</span>
              <span className="vel-t-apy" style={{ color: p.color }}>{p.apy}</span>
              <span className="vel-t-risk">{p.risk}</span>
            </div>
          ))}
        </div>
        <label className="vel-field-label">Amount (cUSDT)</label>
        <input value={depositAmt} onChange={e => setDepositAmt(e.target.value)} placeholder="1000" className="vel-input" style={{ maxWidth: 280 }} />
        <button onClick={approveAndDeposit} disabled={loading === 'deposit'} className="vel-btn-primary">
          {loading === 'deposit' ? 'Encrypting & depositing...' : 'Deposit into Vault'}
        </button>
      </div>

      <div className="vel-card">
        <div className="vel-card-num">02 — Auto-Compound</div>
        <div className="vel-card-title">Auto-compound my yield</div>
        <div className="vel-card-sub">
          Automatically harvests your proportional yield and re-deposits it back into the yield source.
          Your balance grows silently — nobody sees the compound amount. Can be triggered every 100 blocks (~20 mins).
        </div>
        <button onClick={autoCompound} disabled={loading === 'compound'} className="vel-btn-primary">
          {loading === 'compound' ? 'Compounding...' : 'Auto-Compound My Yield'}
        </button>
      </div>

      <div className="vel-card">
        <div className="vel-card-num">03 — Harvest</div>
        <div className="vel-card-title">Harvest my yield</div>
        <div className="vel-card-sub">Pulls your accrued yield from the yield source and adds it to your encrypted vault balance privately via FHE.</div>
        <div style={{ 
          background: '#0a0a0b', 
          border: '1px solid rgba(255,255,255,0.06)', 
          borderRadius: 10, 
          padding: '11px 14px', 
          marginBottom: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#9e9b94', letterSpacing: '0.05em' }}>{address}</span>
        </div>
        <button onClick={harvestYield} disabled={loading === 'harvest'} className="vel-btn-green">
          {loading === 'harvest' ? 'Harvesting...' : 'Harvest My Yield'}
        </button>
      </div>
    </div>
  );
}