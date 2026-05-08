import React, { useEffect, useState } from 'react';
import { getReadVault } from './contract';
import { ethers } from 'ethers';

interface Props { address: string; signer: any; }

const css = `
  .vel-dash-label { font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 0.18em; color: #f5a623; text-transform: uppercase; margin-bottom: 20px; opacity: 0.8; }
  .vel-dash-title { font-family: 'Playfair Display', serif; font-size: 30px; font-weight: 700; font-style: italic; color: #f0ede8; letter-spacing: -0.5px; margin-bottom: 28px; }
  .vel-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 32px; }
  @media (max-width: 768px) {
    .vel-kpi-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
    .vel-pool-grid { grid-template-columns: 1fr !important; gap: 10px; }
    .vel-kpi { padding: 14px 12px; }
    .vel-kpi-val { font-size: 24px; }
    .vel-feature-strip { flex-direction: column; align-items: flex-start; gap: 6px; }
    .vel-dash-title { font-size: 28px; }
  }
  .vel-kpi { background: #111114; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 18px 20px; }
  .vel-kpi-label { font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 0.15em; color: #5a5750; text-transform: uppercase; margin-bottom: 10px; }
  .vel-kpi-val { font-family: 'Playfair Display', serif; font-size: 34px; font-weight: 700; color: #f0ede8; letter-spacing: -0.5px; }
  .vel-kpi-val-enc { font-size: 12px; font-weight: 500; color: #f5a623; margin-top: 4px; }
  .vel-kpi-sub { font-size: 11px; font-weight: 300; color: #5a5750; margin-top: 4px; }
  .vel-kpi-sub-green { font-size: 11px; font-weight: 300; color: #22c55e; margin-top: 4px; }
  .vel-kpi-sub-gold { font-size: 11px; font-weight: 300; color: #f5a623; margin-top: 0; }
  .vel-pool-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 32px; }
  .vel-pool-card { background: #111114; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 22px 20px 20px 24px; position: relative; overflow: hidden; transition: border-color 0.2s; cursor: pointer; }
  .vel-pool-card:hover { border-color: rgba(245,166,35,0.3); }
  .vel-pool-accent { position: absolute; left: 0; top: 0; bottom: 0; width: 3px; }
  .vel-pool-name { font-size: 17px; font-weight: 600; color: #f0ede8; margin-bottom: 4px; }
  .vel-pool-desc { font-size: 11px; font-weight: 300; color: #5a5750; margin-bottom: 18px; line-height: 1.5; }
  .vel-pool-apy { font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 700; letter-spacing: -0.5px; margin-bottom: 2px; }
  .vel-pool-apy-label { font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 0.12em; color: #5a5750; text-transform: uppercase; margin-bottom: 16px; }
  .vel-pool-stats { display: flex; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 14px; }
  .vel-pool-stat { flex: 1; border-right: 1px solid rgba(255,255,255,0.05); padding-right: 12px; margin-right: 12px; }
  .vel-pool-stat:last-child { border-right: none; padding-right: 0; margin-right: 0; }
  .vel-pstat-label { font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 0.1em; color: #3a3830; text-transform: uppercase; margin-bottom: 4px; }
  .vel-pstat-val { font-size: 13px; font-weight: 500; color: #9e9b94; }
  .vel-pstat-conf { font-size: 12px; font-weight: 500; color: #5a5750; }
  .vel-feature-strip { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 32px; padding: 18px 20px; background: #111114; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; }
  .vel-feature-strip-label { font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 0.15em; color: #3a3830; text-transform: uppercase; margin-right: 8px; }
  .vel-feature-pill { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; font-weight: 500; color: #9e9b94; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); padding: 5px 14px; border-radius: 20px; }
  .vel-feature-dot { color: #3a3830; font-size: 10px; }
  .vel-yield-live { display: flex; align-items: center; gap: 6px; margin-top: 6px; }
  .vel-yield-dot { width: 5px; height: 5px; border-radius: 50%; background: #22c55e; animation: velPulse 2s infinite; }
  @keyframes velPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
`;

const pools = [
  { name: 'Safe & Steady', desc: 'First priority — lowest risk, reliable returns', apy: '7.4', risk: 'Very Low', monthly: '~$6.17/$1k', accent: '#22c55e', apyColor: '#22c55e' },
  { name: 'Balanced Returns', desc: 'Second priority — solid returns, moderate risk', apy: '11.8', risk: 'Medium', monthly: '~$9.83/$1k', accent: '#f5a623', apyColor: '#f5a623' },
  { name: 'High Yield', desc: 'Last priority — maximum APY, highest risk', apy: '18.6', risk: 'Higher', monthly: '~$15.50/$1k', accent: '#ef4444', apyColor: '#ef4444' },
];

const featureNames = ['Private Vault', 'Blind Lending', 'Auto-Compound'];

export default function Dashboard({ address, signer }: Props) {
  const [holderCount, setHolderCount] = useState(0);
  const [shieldActive, setShieldActive] = useState(false);
  const [pendingYield, setPendingYield] = useState<bigint>(BigInt(0));
  const [loading, setLoading] = useState(true);
  const [totalDeposited, setTotalDeposited] = useState<number>(0);

  useEffect(() => {
    const load = async () => {
      try {
        const vault = getReadVault(signer);
        const count = await vault.holderCount();
        const position = await vault.getTotalYieldPosition();
        const deposited = await vault.totalVaultDeposited();
        setHolderCount(Number(count.toString()));
        setPendingYield(BigInt(position[1].toString()));
        setTotalDeposited(Number(deposited.toString()));
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    if (signer) load();
    const interval = setInterval(() => { if (signer) load(); }, 30000);
    return () => clearInterval(interval);
  }, [signer]);

  const formattedYield = ethers.formatUnits(pendingYield, 6);

  return (
    <div>
      <style>{css}</style>
      <div className="vel-dash-label">Velucrum Protocol — Confidential DeFi Vault</div>
      <div className="vel-dash-title">Earn yield. Stay private.</div>

      <div className="vel-kpi-grid">
        <div className="vel-kpi">
          <div className="vel-kpi-label">Active Depositors</div>
          <div className="vel-kpi-val">{loading ? '...' : holderCount}</div>
          <div className="vel-kpi-sub-green">On Sepolia testnet</div>
        </div>
        <div className="vel-kpi">
          <div className="vel-kpi-label">Total Vault Size</div>
          <div className="vel-kpi-val-enc">{totalDeposited > 0 ? (totalDeposited / 1e6).toLocaleString('en-US', {minimumFractionDigits: 2}) + ' cUSDT' : '0.00 cUSDT'}</div>
        </div>
        <div className="vel-kpi">
          <div className="vel-kpi-label">Pending Yield</div>
          <div className="vel-kpi-val" style={{ fontSize: 20, marginTop: 4, color: '#22c55e' }}>
            {loading ? '...' : Number(formattedYield).toFixed(6) + ' cUSDT'}
          </div>
          <div className="vel-yield-live">
            <div className="vel-yield-dot" />
            <span className="vel-kpi-sub-gold">Accruing at 7% APY</span>
          </div>
        </div>
        <div className="vel-kpi">
          <div className="vel-kpi-label">Utilization</div>
          <div className="vel-kpi-val" style={{ fontSize: 34, color: '#f5a623' }}>100%</div>
          <div className="vel-kpi-sub-green">Fully deployed to yield</div>
        </div>
      </div>

      <div className="vel-pool-grid">
        {pools.map((p) => (
          <div key={p.name} className="vel-pool-card">
            <div className="vel-pool-accent" style={{ background: p.accent }} />
            <div className="vel-pool-name">{p.name}</div>
            <div className="vel-pool-desc">{p.desc}</div>
            <div className="vel-pool-apy" style={{ color: p.apyColor }}>{p.apy}%</div>
            <div className="vel-pool-apy-label">Annual Percentage Yield</div>
            <div className="vel-pool-stats">
              <div className="vel-pool-stat">
                <div className="vel-pstat-label">Pool Size</div>
                <div className="vel-pstat-conf">{totalDeposited > 0 ? (totalDeposited / 1e6).toLocaleString('en-US', {minimumFractionDigits: 2}) + ' cUSDT' : '0.00 cUSDT'}</div>
              </div>
              <div className="vel-pool-stat">
                <div className="vel-pstat-label">Monthly / $1k</div>
                <div className="vel-pstat-val">{p.monthly}</div>
              </div>
              <div className="vel-pool-stat">
                <div className="vel-pstat-label">Risk</div>
                <div className="vel-pstat-val" style={{ color: p.apyColor }}>{p.risk}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="vel-feature-strip">
        <span className="vel-feature-strip-label">Features</span>
        {featureNames.map((name, i) => (
          <React.Fragment key={name}>
            <span className="vel-feature-pill">{name}</span>
            {i < featureNames.length - 1 && <span className="vel-feature-dot">·</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
