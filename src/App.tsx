import React, { useState, useEffect, useRef } from 'react';
import { connectWallet } from './contract';
import { resetFhevmInstance } from './fhevm';
import Dashboard from './Dashboard';
import IssuerPanel from './VaultManager';
import HolderPanel from './MyPosition';

const SEPOLIA_CHAIN_ID = '0xaa36a7';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
  .vel-root { min-height: 100vh; background: #0a0a0b; color: #f0ede8; font-family: 'Plus Jakarta Sans', sans-serif; position: relative; overflow-x: hidden; }
  .vel-grid-bg { position: fixed; inset: 0; pointer-events: none; z-index: 0; background-image: linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px); background-size: 52px 52px; }
  .vel-orb-tr { position: fixed; top: -140px; right: -140px; width: 400px; height: 400px; border-radius: 50%; background: radial-gradient(circle, rgba(245,166,35,0.07) 0%, transparent 70%); pointer-events: none; z-index: 0; }
  .vel-orb-bl { position: fixed; bottom: -160px; left: -120px; width: 360px; height: 360px; border-radius: 50%; background: radial-gradient(circle, rgba(245,166,35,0.05) 0%, transparent 70%); pointer-events: none; z-index: 0; }
  .vel-nav { position: sticky; top: 0; z-index: 100; display: flex; align-items: center; justify-content: space-between; padding: 0 32px; height: 62px; border-bottom: 1px solid rgba(255,255,255,0.08); background: rgba(10,10,11,0.92); backdrop-filter: blur(12px); }
  .vel-brand { display: flex; align-items: center; gap: 10px; }
  .vel-brand-mark { width: 36px; height: 36px; border: 1px solid rgba(245,166,35,0.4); border-radius: 9px; display: flex; align-items: center; justify-content: center; background: rgba(245,166,35,0.06); overflow: hidden; }
  .vel-brand-name { font-family: 'Playfair Display', serif; font-size: 19px; font-weight: 700; color: #f0ede8; letter-spacing: -0.3px; }
  .vel-brand-name em { font-style: italic; color: #f5a623; }
  .vel-brand-tag { font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 0.18em; color: rgba(245,166,35,0.6); text-transform: uppercase; border: 1px solid rgba(245,166,35,0.2); padding: 3px 8px; border-radius: 4px; background: rgba(245,166,35,0.04); }
  .vel-nav-tabs { display: flex; gap: 2px; }
  .vel-tab { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; font-weight: 500; color: #5a5750; padding: 7px 18px; border-radius: 8px; cursor: pointer; transition: all 0.2s ease; border: 1px solid transparent; background: none; }
  .vel-tab:hover { color: #9e9b94; background: rgba(255,255,255,0.04); }
  .vel-tab:hover { color: #9e9b94; }
  .vel-tab.active { color: #f0ede8; background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.08); }
  .vel-nav-right { display: flex; align-items: center; gap: 10px; position: relative; }
  .vel-pill { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.1em; padding: 5px 12px; border-radius: 20px; display: flex; align-items: center; gap: 6px; }
  .vel-pill-net { background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2); color: #22c55e; }
  .vel-pill-dot { width: 5px; height: 5px; border-radius: 50%; background: #22c55e; animation: velPulse 2s infinite; }
  @keyframes velPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
  .vel-pill-err { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.3); color: #ef4444; cursor: pointer; }
  .vel-wallet-btn { font-family: 'JetBrains Mono', monospace; font-size: 11px; background: rgba(245,166,35,0.08); border: 1px solid rgba(245,166,35,0.25); color: #f5a623; padding: 6px 16px; border-radius: 8px; cursor: pointer; transition: all 0.2s; letter-spacing: 0.05em; display: flex; align-items: center; gap: 8px; }
  .vel-wallet-btn:hover { background: rgba(245,166,35,0.15); border-color: rgba(245,166,35,0.5); }
  .vel-wallet-btn:hover { background: rgba(245,166,35,0.15); }
  .vel-wallet-caret { font-size: 8px; opacity: 0.6; transition: transform 0.2s; }
  .vel-wallet-caret.open { transform: rotate(180deg); }
  .vel-wallet-menu { position: absolute; top: calc(100% + 10px); right: 0; width: 260px; background: #111114; border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; overflow: hidden; z-index: 200; animation: menuSlideIn 0.15s ease; }
  @keyframes menuSlideIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
  .vel-menu-header { padding: 16px 18px; border-bottom: 1px solid rgba(255,255,255,0.06); }
  .vel-menu-addr-label { font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 0.15em; color: #5a5750; text-transform: uppercase; margin-bottom: 6px; }
  .vel-menu-addr { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #f0ede8; word-break: break-all; line-height: 1.5; }
  .vel-menu-section { padding: 8px; }
  .vel-menu-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; cursor: pointer; transition: background 0.15s; font-size: 13px; font-weight: 500; color: #9e9b94; border: none; background: none; width: 100%; text-align: left; font-family: 'Plus Jakarta Sans', sans-serif; }
  .vel-menu-item:hover { background: rgba(255,255,255,0.05); color: #f0ede8; }
  .vel-menu-item-icon { font-size: 14px; width: 20px; text-align: center; }
  .vel-menu-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 4px 8px; }
  .vel-menu-item-danger { color: #ef4444; }
  .vel-menu-item-danger:hover { background: rgba(239,68,68,0.08); color: #ef4444; }
  .vel-err-banner { background: rgba(239,68,68,0.06); border-bottom: 1px solid rgba(239,68,68,0.2); padding: 12px 32px; display: flex; align-items: center; justify-content: space-between; position: relative; z-index: 10; }
  .vel-err-text { font-size: 13px; font-weight: 300; color: #ef4444; }
  .vel-err-text strong { font-weight: 600; }
  @keyframes toastIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes toastOut { from { opacity: 1; } to { opacity: 0; } }
  .vel-toast-container { position: fixed; top: 80px; right: 24px; z-index: 9999; display: flex; flex-direction: column; gap: 8px; pointer-events: none; }
  .vel-toast { background: #1a1a1f; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 12px 16px; min-width: 280px; max-width: 400px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; font-weight: 400; color: #9e9b94; animation: toastIn 0.2s ease; display: flex; align-items: flex-start; gap: 10px; pointer-events: all; box-shadow: 0 4px 24px rgba(0,0,0,0.4); }
  .vel-toast-success { border-color: rgba(34,197,94,0.3); }
  .vel-toast-error { border-color: rgba(239,68,68,0.3); }
  .vel-toast-info { border-color: rgba(245,166,35,0.3); }
  .vel-toast-dot { width: 6px; height: 6px; border-radius: 50%; margin-top: 4px; flex-shrink: 0; }
  .vel-toast-success .vel-toast-dot { background: #22c55e; }
  .vel-toast-error .vel-toast-dot { background: #ef4444; }
  .vel-toast-info .vel-toast-dot { background: #f5a623; }
  .vel-btn-switch { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; font-weight: 600; background: #ef4444; color: white; border: none; padding: 7px 16px; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
  .vel-btn-switch:hover { background: #dc2626; transform: translateY(-1px); }
  .vel-landing { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: calc(100vh - 62px); padding: 60px 32px; text-align: center; }
  .vel-landing-label { font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 0.18em; color: #f5a623; text-transform: uppercase; margin-bottom: 24px; opacity: 0.8; }
  .vel-landing-title { font-family: 'Playfair Display', serif; font-size: 52px; font-weight: 700; font-style: italic; color: #f0ede8; line-height: 1.1; letter-spacing: -1px; margin-bottom: 16px; max-width: 640px; }
  .vel-landing-title span { color: #f5a623; }
  .vel-landing-sub { font-size: 15px; font-weight: 300; color: #5a5750; max-width: 480px; line-height: 1.8; margin-bottom: 40px; }
  .vel-btn-gold { font-family: 'Plus Jakarta Sans', sans-serif; background: #f5a623; color: #0a0a0b; font-size: 14px; font-weight: 700; padding: 13px 32px; border-radius: 10px; border: none; cursor: pointer; transition: all 0.2s ease; }
  .vel-btn-gold:hover { transform: translateY(-1px); box-shadow: 0 0 28px rgba(245,166,35,0.3); }
  .vel-landing-features { display: flex; gap: 32px; margin-top: 56px; flex-wrap: wrap; justify-content: center; }
  .vel-feature { text-align: center; max-width: 160px; }
  .vel-feature-icon { font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 0.15em; color: #f5a623; text-transform: uppercase; margin-bottom: 8px; opacity: 0.7; }
  .vel-feature-text { font-size: 12px; font-weight: 300; color: #5a5750; line-height: 1.6; }
  .vel-content { position: relative; z-index: 1; max-width: 1100px; margin: 0 auto; padding: 36px 32px 60px; }
  @media (max-width: 768px) {
    .vel-nav { padding: 0 16px; }
    .vel-nav-tabs { display: none; }
    .vel-content { padding: 20px 16px 100px; }
    .vel-landing { padding: 40px 16px; }
    .vel-landing-title { font-size: 32px; }
    .vel-err-banner { padding: 10px 16px; flex-direction: column; gap: 8px; }
    .vel-toast { min-width: 260px; max-width: calc(100vw - 32px); }
    .vel-mobile-nav { display: flex; }
  }
  .vel-mobile-nav { display: none; position: fixed; bottom: 0; left: 0; right: 0; background: rgba(10,10,11,0.96); border-top: 1px solid rgba(255,255,255,0.08); backdrop-filter: blur(12px); z-index: 100; padding: 8px 0 20px; justify-content: space-around; align-items: center; }
  .vel-mobile-tab { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 8px 16px; border: none; background: none; cursor: pointer; color: #5a5750; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 10px; font-weight: 500; transition: color 0.2s; }
  .vel-mobile-tab.active { color: #f5a623; }
  .vel-mobile-tab-icon { font-size: 18px; }
`;

function App() {
  const [address, setAddress] = useState('');
  const [toasts, setToasts] = useState<{id: number, msg: string, type: string}[]>([]);
  const toastId = React.useRef(0);

  const showToast = React.useCallback((msg: string, type: string = 'info') => {
    const id = toastId.current++;
    setToasts(prev => [...prev, {id, msg, type}]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  const [signer, setSigner] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'issuer' | 'holder'>('dashboard');
  const [wrongNetwork, setWrongNetwork] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const checkNetwork = async () => {
    if (!window.ethereum) return;
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    setWrongNetwork(chainId !== SEPOLIA_CHAIN_ID);
  };

  const switchToSepolia = async () => {
    try {
      await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: SEPOLIA_CHAIN_ID }] });
      setWrongNetwork(false);
    } catch (e) { alert('Please switch to Sepolia manually.'); }
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('chainChanged', checkNetwork);
      checkNetwork();
    }
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setWalletOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleConnect = async () => {
    try {
      if (window.ethereum) {
        try {
          await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: SEPOLIA_CHAIN_ID }] });
        } catch (e) {}
      }
    } catch(e) {}
    try {
      const { signer, address } = await connectWallet();
      resetFhevmInstance();
      setSigner(signer);
      setAddress(address);
      await checkNetwork();
    } catch (err: any) { alert(err.message); }
  };

  const handleDisconnect = () => {
    setAddress('');
    setSigner(null);
    setWalletOpen(false);
    setActiveTab('dashboard');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shortAddr = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connect Wallet';

  const tabs = [
    { key: 'dashboard', label: 'Markets' },
    { key: 'issuer',    label: 'Vault Manager' },
    { key: 'holder',    label: 'My Position' },
  ] as const;

  return (
    <div className="vel-root">
      <style>{css}</style>
      <div className="vel-grid-bg" />
      <div className="vel-orb-tr" />
      <div className="vel-orb-bl" />

      <nav className="vel-nav">
        <div className="vel-brand">
          <div className="vel-brand-mark">
            <svg width="32" height="32" viewBox="130 108 140 164" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon points="200,108 270,148 270,232 200,272 130,232 130,148" fill="none" stroke="#f5a623" strokeWidth="1" opacity="0.35"/>
              <polygon points="200,126 254,158 254,222 200,254 146,222 146,158" fill="none" stroke="#f5a623" strokeWidth="0.9" opacity="0.6"/>
              <polygon points="200,146 240,168 240,212 200,234 160,212 160,168" fill="rgba(245,166,35,0.07)" stroke="#f5a623" strokeWidth="1.3"/>
              <path d="M170,170 L200,220 L230,170" fill="none" stroke="#f5a623" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="200" cy="220" r="3.5" fill="#f5a623"/>
              <circle cx="200" cy="146" r="2" fill="#f5a623" opacity="0.45"/>
            </svg>
          </div>
          <span className="vel-brand-name">Vel<em>ucrum</em></span>
          <span className="vel-brand-tag">FHEVM</span>
        </div>

        {address && (
          <div className="vel-nav-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`vel-tab ${activeTab === tab.key ? 'active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        <div className="vel-nav-right" ref={menuRef}>
          {address && wrongNetwork && (
            <div className="vel-pill vel-pill-err" onClick={switchToSepolia}>Wrong Network</div>
          )}
          {address && !wrongNetwork && (
            <div className="vel-pill vel-pill-net"><div className="vel-pill-dot" />SEPOLIA</div>
          )}
          <button onClick={() => address ? setWalletOpen(!walletOpen) : handleConnect()} className="vel-wallet-btn">
            {shortAddr}
            {address && <span className={`vel-wallet-caret ${walletOpen ? 'open' : ''}`}>▼</span>}
          </button>

          {walletOpen && address && (
            <div className="vel-wallet-menu">
              <div className="vel-menu-header">
                <div className="vel-menu-addr-label">Connected Wallet</div>
                <div className="vel-menu-addr">{address}</div>
              </div>
              <div className="vel-menu-section">
                <button className="vel-menu-item" onClick={handleCopy}>
                  <span className="vel-menu-item-icon">📋</span>
                  {copied ? 'Copied!' : 'Copy address'}
                </button>
                <button className="vel-menu-item" onClick={() => { window.open(`https://sepolia.etherscan.io/address/${address}`, '_blank'); setWalletOpen(false); }}>
                  <span className="vel-menu-item-icon">🔍</span>
                  View on Etherscan
                </button>
                <button className="vel-menu-item" onClick={() => { switchToSepolia(); setWalletOpen(false); }}>
                  <span className="vel-menu-item-icon">🔄</span>
                  Switch network
                </button>
              </div>
              <div className="vel-menu-divider" />
              <div className="vel-menu-section">
                <button className="vel-menu-item vel-menu-item-danger" onClick={handleDisconnect}>
                  <span className="vel-menu-item-icon">🔌</span>
                  Disconnect
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {address && wrongNetwork && (
        <div className="vel-err-banner">
          <span className="vel-err-text">Switch to <strong>Sepolia testnet</strong> to use Velucrum.</span>
          <button onClick={switchToSepolia} className="vel-btn-switch">Switch to Sepolia</button>
        </div>
      )}

      {!address && (
        <div className="vel-landing">
          <div style={{ marginBottom: 32 }}>
            <svg width="100" height="100" viewBox="130 108 140 164" role="img" xmlns="http://www.w3.org/2000/svg">
              <polygon points="200,108 270,148 270,232 200,272 130,232 130,148" fill="none" stroke="#f5a623" strokeWidth="1" opacity="0.35"/>
              <polygon points="200,126 254,158 254,222 200,254 146,222 146,158" fill="none" stroke="#f5a623" strokeWidth="0.9" opacity="0.6"/>
              <polygon points="200,146 240,168 240,212 200,234 160,212 160,168" fill="rgba(245,166,35,0.07)" stroke="#f5a623" strokeWidth="1.3"/>
              <path d="M170,170 L200,220 L230,170" fill="none" stroke="#f5a623" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="200" cy="220" r="3.5" fill="#f5a623"/>
              <circle cx="200" cy="146" r="2" fill="#f5a623" opacity="0.45"/>
              <circle cx="240" cy="168" r="1.5" fill="#f5a623" opacity="0.35"/>
              <circle cx="240" cy="212" r="1.5" fill="#f5a623" opacity="0.35"/>
              <circle cx="160" cy="168" r="1.5" fill="#f5a623" opacity="0.35"/>
              <circle cx="160" cy="212" r="1.5" fill="#f5a623" opacity="0.35"/>
              <line x1="200" y1="108" x2="200" y2="126" stroke="#f5a623" strokeWidth="0.7" opacity="0.25"/>
              <line x1="270" y1="148" x2="254" y2="158" stroke="#f5a623" strokeWidth="0.7" opacity="0.25"/>
              <line x1="270" y1="232" x2="254" y2="222" stroke="#f5a623" strokeWidth="0.7" opacity="0.25"/>
              <line x1="200" y1="272" x2="200" y2="254" stroke="#f5a623" strokeWidth="0.7" opacity="0.25"/>
              <line x1="130" y1="232" x2="146" y2="222" stroke="#f5a623" strokeWidth="0.7" opacity="0.25"/>
              <line x1="130" y1="148" x2="146" y2="158" stroke="#f5a623" strokeWidth="0.7" opacity="0.25"/>

            </svg>
          </div>
          <div className="vel-landing-label">Confidential DeFi Vault — Powered by Zama FHEVM</div>
          <h1 className="vel-landing-title">Yield, <span>veiled.</span></h1>
          <p className="vel-landing-sub">
            Deposit cUSDT, earn yield privately, borrow against encrypted collateral, and compete on yield —
            all with your balance fully encrypted on-on-chain using Zama FHEVM.
          </p>
          <button onClick={handleConnect} className="vel-btn-gold">Connect Wallet to Start</button>
          <div className="vel-landing-features">
            {[
              { label: 'Private Vault', text: 'Deposit & earn with encrypted balance' },
              { label: 'Blind Lending', text: 'Borrow against encrypted collateral' },
              { label: 'Auto-Compound', text: 'Yield re-invested silently on-chain' },
            ].map((f) => (
              <div key={f.label} className="vel-feature">
                <div className="vel-feature-icon">{f.label}</div>
                <div className="vel-feature-text">{f.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {address && (
        <div className="vel-content">
          {activeTab === 'dashboard' && <Dashboard address={address} signer={signer} />}
          {activeTab === 'issuer'    && <IssuerPanel address={address} signer={signer} />}
          {activeTab === 'holder'    && <HolderPanel address={address} signer={signer} />}
        </div>
      )}
      {address && (
          <div className="vel-mobile-nav">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`vel-mobile-tab ${activeTab === tab.key ? 'active' : ''}`}
              >
                <span className="vel-mobile-tab-icon">
                  {tab.key === 'dashboard' ? '📊' : tab.key === 'issuer' ? '🏦' : '👤'}
                </span>
                {tab.label}
              </button>
            ))}
          </div>
        )}
      <div className="vel-toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`vel-toast vel-toast-${t.type}`}>
            <div className="vel-toast-dot" />
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;