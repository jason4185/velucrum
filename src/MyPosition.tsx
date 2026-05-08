import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getFhevmInstance, encryptUint64 } from './fhevm';
import { VAULT_ABI, CUSDT_ABI } from './contract';

const VAULT_ADDRESS = process.env.REACT_APP_VAULT_ADDRESS!;
const CUSDT_ADDRESS = process.env.REACT_APP_CUSDT_ADDRESS!;

const css = `
  .vel-holder-label { font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 0.18em; color: #f5a623; text-transform: uppercase; margin-bottom: 8px; opacity: 0.6; }
  .vel-holder-title { font-size: 28px; font-weight: 700; color: #f0ede8; font-family: 'Playfair Display', serif; margin-bottom: 24px; }
  .vel-holder-msg { background: rgba(245,166,35,0.08); border: 1px solid rgba(245,166,35,0.25); border-radius: 8px; padding: 10px 16px; font-size: 12px; color: #f5a623; margin-bottom: 16px; font-family: 'JetBrains Mono', monospace; }
  .vel-card { background: #111114; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 24px; margin-bottom: 16px; }
  .vel-card-num { font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 0.18em; color: #f5a623; text-transform: uppercase; margin-bottom: 6px; opacity: 0.6; }
  .vel-card-title { font-size: 16px; font-weight: 600; color: #f0ede8; margin-bottom: 4px; }
  .vel-card-sub { font-size: 12px; font-weight: 300; color: #5a5750; margin-bottom: 20px; line-height: 1.6; }
  .vel-status-row { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
  .vel-status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .vel-status-text { font-size: 12px; color: #8a8780; font-family: 'Plus Jakarta Sans', sans-serif; }
  .vel-info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-top: 16px; }
  .vel-info-cell { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 14px; }
  .vel-info-label { font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 0.12em; color: #5a5750; text-transform: uppercase; margin-bottom: 6px; }
  .vel-info-val { font-size: 18px; font-weight: 600; color: #f0ede8; }
  .vel-info-enc { font-size: 11px; color: #3a3830; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.1em; }
  .vel-pool-badge { display: inline-block; font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 20px; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.08em; }
  .vel-field-label { display: block; font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 0.14em; color: #5a5750; text-transform: uppercase; margin-bottom: 8px; }
  .vel-input { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 10px 14px; color: #f0ede8; font-size: 14px; font-family: 'Plus Jakarta Sans', sans-serif; outline: none; display: block; margin-bottom: 14px; width: 100%; box-sizing: border-box; }
  .vel-btn-primary { background: #f5a623; color: #0a0a0b; font-size: 12px; font-weight: 700; padding: 10px 24px; border-radius: 8px; border: none; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; letter-spacing: 0.04em; transition: all 0.2s; }
  .vel-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 0 20px rgba(245,166,35,0.25); }
  .vel-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
  .vel-btn-red { background: transparent; color: #ef4444; font-size: 12px; font-weight: 700; padding: 10px 24px; border-radius: 8px; border: 1px solid rgba(239,68,68,0.4); cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; letter-spacing: 0.04em; transition: all 0.2s; }
  .vel-btn-red:hover { background: rgba(239,68,68,0.08); transform: translateY(-1px); }
  .vel-btn-red:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
  .vel-loan-toggle { display: flex; gap: 8px; margin-bottom: 20px; }
  .vel-toggle-btn { flex: 1; padding: 8px; border-radius: 8px; font-size: 11px; font-weight: 600; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.08em; cursor: pointer; transition: all 0.2s; border: 1px solid rgba(255,255,255,0.08); background: transparent; color: #5a5750; }
  .vel-toggle-btn:hover { background: rgba(255,255,255,0.04); color: #9e9b94; }
  .vel-toggle-btn.active { background: rgba(245,166,35,0.12); border-color: rgba(245,166,35,0.4); color: #f5a623; }
`;

const POOL_NAMES: Record<number, string> = { 0: 'USDT Stable', 1: 'ETH Yield', 2: 'BTC Vault' };
const POOL_STYLES: Record<number, { bg: string; color: string; border: string }> = {
  0: { bg: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' },
  1: { bg: 'rgba(245,166,35,0.12)', color: '#f5a623', border: '1px solid rgba(245,166,35,0.3)' },
  2: { bg: 'rgba(249,115,22,0.12)', color: '#f97316', border: '1px solid rgba(249,115,22,0.3)' },
};

interface Props {
  signer: any;
  address: string;
}

const MyPosition: React.FC<Props> = ({ signer, address }) => {
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState('');
  const [isHolder, setIsHolder] = useState(false);
  const [hasLoan, setHasLoan] = useState(false);
  const [pool, setPool] = useState(0);
  const [revealedBalance, setRevealedBalance] = useState<string | null>(null);
  const [revealedYield, setRevealedYield] = useState<string | null>(null);
  const [withdrawAmt, setWithdrawAmt] = useState('');
  const [loanAmt, setLoanAmt] = useState('');
  const [repayAmt, setRepayAmt] = useState('');
  const [loanTab, setLoanTab] = useState<'borrow' | 'repay'>('borrow');
  const [revealedLoan, setRevealedLoan] = useState<string | null>(null);

  const parseError = (e: any): string => {
    const msg = e?.message || '';
    if (e?.code === 4001 || msg.includes('user rejected') || msg.includes('User denied')) return 'Transaction rejected.';
    if (msg.includes('insufficient funds')) return 'Insufficient funds for gas.';
    if (msg.includes('Repay loan first')) return 'You have an active loan. Please repay it before withdrawing.';
    if (msg.includes('Exceeds deposit')) return 'Amount exceeds your deposited balance.';
    if (msg.includes('No deposit')) return 'You have no active deposit.';
    if (msg.includes('Loan already open')) return 'You already have an active loan. Repay it first.';
    if (msg.includes('No active loan')) return 'You have no active loan to repay.';
    if (msg.includes('Transfer failed')) return 'Token transfer failed. Check your cUSDT balance and approval.';
    if (msg.includes('Exceeds collateral limit')) return 'Loan amount exceeds 70% of your vault balance. Reduce your loan amount.';
    if (msg.includes('Repay amount must match loan amount')) return 'You must repay the exact loan amount. Enter the full amount you borrowed.';
    if (msg.includes('execution reverted')) return 'Transaction reverted by contract. Check your inputs.';
    if (msg.includes('network') || msg.includes('fetch')) return 'Network error. Please check your connection.';
    if (msg.includes('ACL')) return 'Access denied — you are not authorized to decrypt this value.';
    return 'Something went wrong. Please try again.';
  };

  useEffect(() => {
    if (signer && address) fetchStatus();
  }, [signer, address]);

  const getContracts = () => {
    const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer);
    const cusdt = new ethers.Contract(CUSDT_ADDRESS, CUSDT_ABI, signer);
    return { vault, cusdt };
  };

  const fetchStatus = async () => {
    try {
      const { vault } = getContracts();
      const deposited = await vault.getUserDeposited(address);
      setIsHolder(BigInt(deposited) > 0n);
      const hasLoanResult = await vault.hasActiveLoan();
      setHasLoan(hasLoanResult);

    } catch (e: any) {
      console.log('fetchStatus error:', e.message);
    }
  };

  const revealBalance = async () => {
    if (!signer) return;
    setLoading('reveal');
    setMsg('');
    try {
      const { vault } = getContracts();
      const instance = await getFhevmInstance();
      const keypair = instance.generateKeypair();
      const startTimestamp = Math.floor(Date.now() / 1000);
      const durationDays = 1;
      const eip712 = instance.createEIP712(
        keypair.publicKey,
        [VAULT_ADDRESS as `0x${string}`],
        startTimestamp,
        durationDays
      );
      const sig = await signer.signTypedData(
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        eip712.message
      );
      const balHandle = await vault.getMyBalance();
      const yieldHandle = await vault.getMyYield();
      const result = await instance.userDecrypt(
        [
          { handle: balHandle as `0x${string}`, contractAddress: VAULT_ADDRESS as `0x${string}` },
          { handle: yieldHandle as `0x${string}`, contractAddress: VAULT_ADDRESS as `0x${string}` }
        ],
        keypair.privateKey,
        keypair.publicKey,
        sig,
        [VAULT_ADDRESS as `0x${string}`],
        address as `0x${string}`,
        startTimestamp,
        durationDays
      );
      const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
      const keys = Object.keys(result);
      const n0 = Number(result[keys[0]]) / 1e6;
      const n1 = keys[1] ? Number(result[keys[1]]) / 1e6 : 0;
      if (n0 >= n1) {
        setRevealedBalance(fmt(n0));
        if (keys[1]) setRevealedYield(fmt(n1));
      } else {
        setRevealedBalance(fmt(n1));
        setRevealedYield(fmt(n0));
      }
    } catch (e: any) {
      setMsg(parseError(e));
    }
    setLoading('');
  };
  const revealLoan = async () => {
    if (!signer) return;
    setLoading('loan-reveal');
    try {
      const { vault } = getContracts();
      const instance = await getFhevmInstance();
      const keypair = instance.generateKeypair();
      const startTimestamp = Math.floor(Date.now() / 1000);
      const durationDays = 1;
      const eip712 = instance.createEIP712(keypair.publicKey, [VAULT_ADDRESS as `0x${string}`], startTimestamp, durationDays);
      const sig = await signer.signTypedData(eip712.domain, { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification }, eip712.message);
      const loanHandle = await vault.getMyLoan();
      const result = await instance.userDecrypt(
        [{ handle: loanHandle as `0x${string}`, contractAddress: VAULT_ADDRESS as `0x${string}` }],
        keypair.privateKey, keypair.publicKey, sig,
        [VAULT_ADDRESS as `0x${string}`], address as `0x${string}`,
        startTimestamp, durationDays
      );
      const keys = Object.keys(result) as `0x${string}`[];
      if (keys[0]) setRevealedLoan((Number(result[keys[0]]) / 1e6).toFixed(6));
    } catch (e: any) { setMsg(parseError(e)); }
    setLoading('');
  };

  const withdraw = async () => {
    if (!signer || !withdrawAmt) return;
    setLoading('withdraw');
    setMsg('');
    try {
      const { vault } = getContracts();
      const amount = Math.floor(parseFloat(withdrawAmt) * 1e6);
      const tx = await vault.withdraw(amount);
      await tx.wait();
      setMsg('Withdrawal successful!');
      setWithdrawAmt('');
      fetchStatus();
    } catch (e: any) {
      setMsg(parseError(e));
    }
    setLoading('');
  };

  const openLoan = async () => {
    if (!signer || !loanAmt) return;
    setLoading('loan');
    setMsg('');
    try {
      const { vault } = getContracts();
      const amount = Math.floor(parseFloat(loanAmt) * 1e6);
      const encrypted = await encryptUint64(amount, VAULT_ADDRESS, address);
      const tx = await vault.openLoan(encrypted.handle, encrypted.proof, amount);
      await tx.wait();
      setMsg('Loan opened successfully!');
      setLoanAmt('');
      fetchStatus();
    } catch (e: any) {
      setMsg(parseError(e));
    }
    setLoading('');
  };

  const repayLoan = async () => {
    if (!signer || !repayAmt) return;
    setLoading('repay');
    setMsg('');
    try {
      const { vault, cusdt } = getContracts();
      const amount = Math.floor(parseFloat(repayAmt) * 1e6);
      const approveTx = await cusdt.approve(VAULT_ADDRESS, amount);
      await approveTx.wait();
      const encrypted = await encryptUint64(amount, VAULT_ADDRESS, address);
      const tx = await vault.repayLoan(encrypted.handle, encrypted.proof, amount);
      await tx.wait();
      setMsg('Loan repaid successfully!');
      setRepayAmt('');
      fetchStatus();
    } catch (e: any) {
      setMsg(parseError(e));
    }
    setLoading('');
  };

  const poolStyle = POOL_STYLES[pool] || POOL_STYLES[0];

  return (
    <div>
      <style>{css}</style>
      <div className="vel-holder-label">Velucrum Protocol — My Position</div>
      <div className="vel-holder-title">My encrypted position</div>
      {msg && <div className="vel-holder-msg">{msg}</div>}

      {/* 01 — Status */}
      <div className="vel-card">
        <div className="vel-card-num">01 — Status</div>
        <div className="vel-card-title">Your vault position</div>
        <div className="vel-status-row">
          <div className="vel-status-dot" style={{ background: isHolder ? '#22c55e' : '#ef4444' }} />
          <span className="vel-status-text">
            {isHolder ? 'Active depositor — your position is encrypted on-chain' : 'Not deposited — go to Vault Manager to get started'}
          </span>
        </div>
        {isHolder && (
          <div className="vel-info-grid">
            <div className="vel-info-cell">
              <div className="vel-info-label">Pool</div>
              <span className="vel-pool-badge" style={{ background: poolStyle.bg, color: poolStyle.color, border: poolStyle.border }}>
                {POOL_NAMES[pool] || 'Unknown'}
              </span>
            </div>
            <div className="vel-info-cell">
              <div className="vel-info-label">Loan Status</div>
              <div className="vel-info-val" style={{ color: hasLoan ? '#f59e0b' : '#22c55e', fontSize: 14 }}>
                {hasLoan ? 'Active loan' : 'No loan'}
              </div>
              {hasLoan && (
                <div style={{ marginTop: 8 }}>
                  {revealedLoan !== null
                    ? <div style={{ fontSize: 12, color: '#f59e0b', fontFamily: 'JetBrains Mono, monospace' }}>{revealedLoan} cUSDT</div>
                    : <button onClick={revealLoan} disabled={loading === 'loan-reveal'} style={{ fontSize: 10, padding: '3px 10px', borderRadius: 6, background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.25)', color: '#f5a623', cursor: 'pointer' }}>
                        {loading === 'loan-reveal' ? 'Decrypting...' : 'Reveal Loan'}
                      </button>
                  }
                </div>
              )}
            </div>
            <div className="vel-info-cell">
              <div className="vel-info-label">Your Balance</div>
              {revealedBalance !== null
                ? <div className="vel-info-val" style={{ color: '#f5a623', fontFamily: 'Playfair Display, serif' }}>{revealedBalance} cUSDT</div>
                : <div className="vel-info-enc">Confidential</div>
              }
            </div>
            <div className="vel-info-cell">
              <div className="vel-info-label">Yield Earned</div>
              {revealedYield !== null
                ? <div className="vel-info-val" style={{ color: '#22c55e', fontFamily: 'Playfair Display, serif' }}>{revealedYield} cUSDT</div>
                : <div className="vel-info-enc">Confidential</div>
              }
            </div>
          </div>
        )}
        {isHolder && (
          <button
            onClick={revealBalance}
            disabled={loading === 'reveal'}
            style={{
              marginTop: 16,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              background: 'rgba(245,166,35,0.08)',
              border: '1px solid rgba(245,166,35,0.25)',
              color: '#f5a623',
              fontSize: 12,
              fontWeight: 600,
              padding: '8px 20px',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {loading === 'reveal' ? 'Decrypting...' : revealedBalance !== null ? 'Refresh Balance' : 'Reveal My Balance'}
          </button>
        )}
      </div>

      {isHolder && (
        <>
          {/* 02 — Withdraw */}
          <div className="vel-card">
            <div className="vel-card-num">02 — Withdraw</div>
            <div className="vel-card-title">Withdraw from vault</div>
            <div className="vel-card-sub">Withdraw your cUSDT balance. You must repay any active loan first.</div>
            <label className="vel-field-label">Amount (cUSDT)</label>
            <input
              value={withdrawAmt}
              onChange={e => setWithdrawAmt(e.target.value)}
              placeholder="500"
              className="vel-input"
              style={{ maxWidth: 280 }}
            />
            <button onClick={withdraw} disabled={loading === 'withdraw' || !withdrawAmt || hasLoan} className="vel-btn-primary">
              {loading === 'withdraw' ? 'Withdrawing...' : 'Withdraw cUSDT'}
            </button>
          </div>

          {/* 03 — Blind Lending */}
          <div className="vel-card">
            <div className="vel-card-num">03 — Blind Lending</div>
            <div className="vel-card-title">Borrow against your vault</div>
            <div className="vel-card-sub">Borrow up to 70% of your encrypted balance. Collateral is verified privately — your balance is never exposed.</div>
            <div className="vel-loan-toggle">
              <button className={`vel-toggle-btn ${loanTab === 'borrow' ? 'active' : ''}`} onClick={() => setLoanTab('borrow')}>Borrow</button>
              <button className={`vel-toggle-btn ${loanTab === 'repay' ? 'active' : ''}`} onClick={() => setLoanTab('repay')}>Repay</button>
            </div>
            {loanTab === 'borrow' ? (
              <>
                <label className="vel-field-label">Loan Amount (cUSDT)</label>
                <input
                  value={loanAmt}
                  onChange={e => setLoanAmt(e.target.value)}
                  placeholder="500"
                  className="vel-input"
                  style={{ maxWidth: 280 }}
                />
                <button onClick={openLoan} disabled={loading === 'loan' || !loanAmt || hasLoan} className="vel-btn-primary">
                  {loading === 'loan' ? 'Opening loan...' : 'Open Blind Loan'}
                </button>
              </>
            ) : (
              <>
                <label className="vel-field-label">Repay Amount (cUSDT)</label>
                <input
                  value={repayAmt}
                  onChange={e => setRepayAmt(e.target.value)}
                  placeholder="500"
                  className="vel-input"
                  style={{ maxWidth: 280 }}
                />
                <button onClick={repayLoan} disabled={loading === 'repay' || !repayAmt} className="vel-btn-red">
                  {loading === 'repay' ? 'Repaying...' : 'Repay Loan'}
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default MyPosition;