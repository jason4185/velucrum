import React, { useState } from 'react';
import { getVault, getCUSDT } from './contract';
import { encryptUint64 } from './fhevm';

const VAULT_ADDRESS = process.env.REACT_APP_VAULT_ADDRESS!;

interface Props { address: string; signer: any; }

const css = `
  .vel-wager-label { font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 0.18em; color: #f5a623; text-transform: uppercase; margin-bottom: 20px; opacity: 0.8; }
  .vel-wager-title { font-family: 'Playfair Display', serif; font-size: 30px; font-weight: 700; font-style: italic; color: #f0ede8; letter-spacing: -0.5px; margin-bottom: 8px; }
  .vel-wager-sub { font-size: 13px; font-weight: 300; color: #5a5750; margin-bottom: 28px; line-height: 1.6; }
  .vel-msg { background: #111114; border: 1px solid rgba(245,166,35,0.2); border-radius: 10px; padding: 14px 18px; font-size: 13px; font-weight: 300; color: #9e9b94; margin-bottom: 20px; }
  .vel-card { background: #111114; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 24px; margin-bottom: 16px; }
  .vel-card-num { font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 0.18em; color: #f5a623; text-transform: uppercase; margin-bottom: 6px; opacity: 0.6; }
  .vel-card-title { font-size: 16px; font-weight: 600; color: #f0ede8; margin-bottom: 4px; }
  .vel-card-sub { font-size: 12px; font-weight: 300; color: #5a5750; margin-bottom: 20px; line-height: 1.6; }
  .vel-field-label { font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 0.15em; color: #5a5750; text-transform: uppercase; margin-bottom: 7px; display: block; }
  .vel-input { width: 100%; background: #18181d; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 11px 14px; font-size: 13px; font-family: 'Plus Jakarta Sans', sans-serif; color: #f0ede8; outline: none; transition: border 0.2s; margin-bottom: 14px; }
  .vel-input:focus { border-color: rgba(245,166,35,0.4); box-shadow: 0 0 0 3px rgba(245,166,35,0.07); }
  .vel-input::placeholder { color: #2a2825; font-style: italic; font-weight: 300; }
  .vel-btn-primary { font-family: 'Plus Jakarta Sans', sans-serif; background: #f5a623; color: #0a0a0b; font-size: 13px; font-weight: 700; padding: 11px 24px; border-radius: 10px; border: none; cursor: pointer; transition: all 0.2s ease; margin-right: 10px; }
  .vel-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 0 20px rgba(245,166,35,0.25); }
  .vel-btn-primary:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }
  .vel-btn-green { font-family: 'Plus Jakarta Sans', sans-serif; background: rgba(34,197,94,0.12); color: #22c55e; font-size: 13px; font-weight: 600; padding: 11px 24px; border-radius: 10px; border: 1px solid rgba(34,197,94,0.25); cursor: pointer; transition: all 0.2s; margin-right: 10px; }
  .vel-btn-green:hover { background: rgba(34,197,94,0.2); }
  .vel-btn-green:disabled { opacity: 0.35; cursor: not-allowed; }
  .vel-btn-red { font-family: 'Plus Jakarta Sans', sans-serif; background: rgba(239,68,68,0.12); color: #ef4444; font-size: 13px; font-weight: 600; padding: 11px 24px; border-radius: 10px; border: 1px solid rgba(239,68,68,0.25); cursor: pointer; transition: all 0.2s; }
  .vel-btn-red:hover { background: rgba(239,68,68,0.2); }
  .vel-btn-red:disabled { opacity: 0.35; cursor: not-allowed; }
  .vel-info-box { background: rgba(245,166,35,0.04); border: 1px solid rgba(245,166,35,0.12); border-radius: 10px; padding: 14px 16px; margin-bottom: 16px; font-size: 12px; color: #5a5750; line-height: 1.7; }
  .vel-info-box b { color: #9e9b94; font-weight: 500; }
  .vel-wager-id { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #f5a623; background: rgba(245,166,35,0.08); border: 1px solid rgba(245,166,35,0.2); padding: 8px 14px; border-radius: 8px; margin-bottom: 14px; display: inline-block; }
`;

export default function WagerPanel({ address, signer }: Props) {
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState('');

  // Create wager state
  const [opponent, setOpponent] = useState('');
  const [duration, setDuration] = useState('');
  const [stakeAmt, setStakeAmt] = useState('');
  const [lastWagerId, setLastWagerId] = useState<number | null>(null);

  // Accept wager state
  const [acceptId, setAcceptId] = useState('');
  const [acceptStake, setAcceptStake] = useState('');

  // Resolve state
  const [resolveId, setResolveId] = useState('');

  const createWager = async () => {
    try {
      setLoading('create');
      setMsg('Encrypting your stake amount...');
      const plainStake = Math.floor(Number(stakeAmt) * 1e6);
      const cusdt = getCUSDT(signer);
      await (await cusdt.approve(VAULT_ADDRESS, BigInt(plainStake))).wait();
      setMsg('Approved. Creating blind wager...');
      const enc = await encryptUint64(Math.floor(Number(stakeAmt) * 1e6), VAULT_ADDRESS, address);
      const vault = getVault(signer);
      const tx = await vault.createWager(
        opponent,
        Number(duration),
        enc.handle,
        enc.proof,
        plainStake
      );
      const receipt = await tx.wait();
      const wagerId = Number(await vault.wagerCount()) - 1;
      setLastWagerId(wagerId);
      setMsg(`Wager #${wagerId} created. Share this ID with your opponent: ${wagerId}`);
      setOpponent('');
      setStakeAmt('100');
    } catch (e: any) {
      const reason = e.reason || e.message || '';
      if (reason.includes('user rejected') || reason.includes('ACTION_REJECTED')) {
        setMsg('Transaction cancelled.');
      } else if (reason.includes('Not a holder')) {
        setMsg('You need to deposit first before creating a wager.');
      } else if (reason.includes('Opponent not a holder')) {
        setMsg('Your opponent needs to deposit first.');
      } else {
        setMsg('Error: ' + reason);
      }
    }
    setLoading('');
  };

  const acceptWager = async () => {
    try {
      setLoading('accept');
      setMsg('Encrypting your stake...');
      const plainStake = Math.floor(Number(acceptStake) * 1e6);
      const cusdt = getCUSDT(signer);
      await (await cusdt.approve(VAULT_ADDRESS, BigInt(plainStake))).wait();
      setMsg('Approved. Accepting wager...');
      const enc = await encryptUint64(Math.floor(Number(acceptStake) * 1e6), VAULT_ADDRESS, address);
      const vault = getVault(signer);
      await (await vault.acceptWager(
        Number(acceptId),
        enc.handle,
        enc.proof,
        plainStake
      )).wait();
      setMsg(`Wager #${acceptId} accepted. Competition has started. May the best yield win.`);
      setAcceptId('');
    } catch (e: any) {
      const reason = e.reason || e.message || '';
      if (reason.includes('user rejected') || reason.includes('ACTION_REJECTED')) {
        setMsg('Transaction cancelled.');
      } else if (reason.includes('Not open')) {
        setMsg('This wager is no longer open.');
      } else if (reason.includes('Not the opponent')) {
        setMsg('You are not the opponent for this wager.');
      } else {
        setMsg('Error: ' + reason);
      }
    }
    setLoading('');
  };

  const resolveWager = async () => {
    try {
      setLoading('resolve');
      setMsg('Resolving wager — comparing yields via FHE...');
      const vault = getVault(signer);
      await (await vault.resolveWager(Number(resolveId))).wait();
      setMsg(`Wager #${resolveId} resolved. Winner determined privately via FHE comparison.`);
      setResolveId('');
    } catch (e: any) {
      const reason = e.reason || e.message || '';
      if (reason.includes('user rejected') || reason.includes('ACTION_REJECTED')) {
        setMsg('Transaction cancelled.');
      } else if (reason.includes('Still running')) {
        setMsg('Wager duration has not ended yet. Wait for more blocks.');
      } else if (reason.includes('Not accepted')) {
        setMsg('Wager has not been accepted by opponent yet.');
      } else {
        setMsg('Error: ' + reason);
      }
    }
    setLoading('');
  };

  const cancelWager = async () => {
    try {
      setLoading('cancel');
      setMsg('Cancelling wager...');
      const vault = getVault(signer);
      await (await vault.cancelWager(Number(resolveId))).wait();
      setMsg(`Wager #${resolveId} cancelled successfully.`);
      setResolveId('');
    } catch (e: any) {
      const reason = e.reason || e.message || '';
      if (reason.includes('user rejected') || reason.includes('ACTION_REJECTED')) {
        setMsg('Transaction cancelled.');
      } else {
        setMsg('Error: ' + reason);
      }
    }
    setLoading('');
  };

  return (
    <div>
      <style>{css}</style>
      <div className="vel-wager-label">Velucrum Protocol — Yield Wager</div>
      <div className="vel-wager-title">Compete blindly. Win privately.</div>
      <div className="vel-wager-sub">
        Challenge another holder to a yield competition. Stakes are encrypted — neither party knows the other's bet.
        Winner is determined by FHE comparison of yield earned. Nobody sees individual performance.
      </div>

      {msg && <div className="vel-msg">{msg}</div>}

      {/* Create Wager */}
      <div className="vel-card">
        <div className="vel-card-num">01 — Create</div>
        <div className="vel-card-title">Challenge an opponent</div>
        <div className="vel-card-sub">
          Set your encrypted stake and challenge another holder. They won't see your stake amount —
          only that a challenge was sent. Competition starts when they accept.
        </div>

        <div className="vel-info-box">
          <b>How it works:</b> Both parties deposit an encrypted stake. After the duration ends,
          FHE compares who earned more yield. Winner takes both stakes. Neither party sees the other's performance.
        </div>

        <label className="vel-field-label">Opponent Wallet Address</label>
        <input value={opponent} onChange={e => setOpponent(e.target.value)} placeholder="0x..." className="vel-input" />

        <label className="vel-field-label">Duration (blocks) — 100 blocks ≈ 20 mins</label>
        <input value={duration} onChange={e => setDuration(e.target.value)} placeholder="100" className="vel-input" style={{ maxWidth: 200 }} />

        <label className="vel-field-label">Your Stake (cUSDT) — encrypted, opponent cannot see</label>
        <input value={stakeAmt} onChange={e => setStakeAmt(e.target.value)} placeholder="100" className="vel-input" style={{ maxWidth: 200 }} />

        <button onClick={createWager} disabled={loading === 'create' || !opponent} className="vel-btn-primary">
          {loading === 'create' ? 'Creating wager...' : 'Create Blind Wager'}
        </button>

        {lastWagerId !== null && (
          <div style={{ marginTop: 14, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, letterSpacing: '0.15em', color: '#22c55e', textTransform: 'uppercase', marginBottom: 8 }}>Wager Created — Share ID with Opponent</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700, color: '#f5a623' }}>#{lastWagerId}</div>
              <button
                onClick={() => { navigator.clipboard.writeText(String(lastWagerId)); setMsg('Wager ID copied to clipboard.'); }}
                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.25)', color: '#f5a623', fontSize: 11, fontWeight: 600, padding: '6px 14px', borderRadius: 7, cursor: 'pointer' }}
              >
                Copy ID
              </button>
            </div>
            <div style={{ fontSize: 11, color: '#5a5750', marginTop: 6 }}>Send this number to your opponent so they can accept the challenge</div>
          </div>
        )}
      </div>

      {/* Accept Wager */}
      <div className="vel-card">
        <div className="vel-card-num">02 — Accept</div>
        <div className="vel-card-title">Accept a challenge</div>
        <div className="vel-card-sub">
          Got a wager ID from a challenger? Enter it below with your encrypted stake to accept.
          You won't see their stake — the competition is completely blind.
        </div>

        <label className="vel-field-label">Wager ID</label>
        <input value={acceptId} onChange={e => setAcceptId(e.target.value)} placeholder="0" className="vel-input" style={{ maxWidth: 120 }} />

        <label className="vel-field-label">Your Stake (cUSDT) — encrypted</label>
        <input value={acceptStake} onChange={e => setAcceptStake(e.target.value)} placeholder="100" className="vel-input" style={{ maxWidth: 200 }} />

        <button onClick={acceptWager} disabled={loading === 'accept' || !acceptId} className="vel-btn-green">
          {loading === 'accept' ? 'Accepting...' : 'Accept Wager'}
        </button>
      </div>

      {/* Resolve / Cancel */}
      <div className="vel-card">
        <div className="vel-card-num">03 — Resolve</div>
        <div className="vel-card-title">Resolve or cancel a wager</div>
        <div className="vel-card-sub">
          After the duration ends, resolve the wager to determine the winner via FHE yield comparison.
          Only the challenger can cancel an open wager.
        </div>

        <label className="vel-field-label">Wager ID</label>
        <input value={resolveId} onChange={e => setResolveId(e.target.value)} placeholder="0" className="vel-input" style={{ maxWidth: 120 }} />

        <button onClick={resolveWager} disabled={loading === 'resolve' || !resolveId} className="vel-btn-primary">
          {loading === 'resolve' ? 'Resolving...' : 'Resolve Wager'}
        </button>
        <button onClick={cancelWager} disabled={loading === 'cancel' || !resolveId} className="vel-btn-red">
          {loading === 'cancel' ? 'Cancelling...' : 'Cancel Wager'}
        </button>
      </div>
    </div>
  );
}
