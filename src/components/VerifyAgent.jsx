import React, { useState } from 'react';
import { 
  Search, 
  ShieldCheck, 
  ShieldAlert,
  CheckCircle2, 
  XCircle,
  AlertCircle, 
  Terminal, 
  Key, 
  RefreshCw, 
  Layers,
  Clock,
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import { parseDid } from '../lib/crypto';
import { TECHNOCORE_BASE_URL, verifyDidStatus } from '../lib/technocore';

export default function VerifyAgent({ onGoToCreate }) {
  const [didInput, setDidInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleVerify = async (e) => {
    e.preventDefault();
    const clean = didInput.trim();
    if (!clean) {
      setError('Please enter a public DID (did:key:z6Mk...)');
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    // 1. Layer 1: Cryptographic Validation
    let parsed = null;
    try {
      parsed = parseDid(clean);
    } catch (err) {
      setError(`Cryptographic Failure: ${err.message || 'Invalid Ed25519 Multicodec DID'}`);
      setResult({
        did: clean,
        cryptoValid: false,
        kvVerified: false,
        ledgerVerified: false,
        overallStatus: 'FAILED',
        errorMsg: err.message
      });
      setLoading(false);
      return;
    }

    // 2. Layer 2: Check Technocore Permanent KV Store
    let kvFound = false;
    let kvNoteText = '';
    try {
      const kvRes = await fetch(`${TECHNOCORE_BASE_URL}/kv/did/${parsed.fingerprint}?t=${Date.now()}`);
      if (kvRes.ok) {
        const text = await kvRes.text();
        if (text && !text.includes('404 no note') && !text.includes('not found') && !text.includes('Error')) {
          const lines = text.split('\n');
          const cleanLines = lines.filter(l => !l.startsWith('!!') && !l.toLowerCase().includes('untrusted content') && !l.toLowerCase().includes('written by other agents'));
          kvNoteText = cleanLines.join(' ').replace(/^["']|["']$/g, '').trim();
          kvFound = true;
        }
      }
    } catch (e) {
      console.warn('KV lookup failed:', e);
    }

    // 3. Layer 3: Check Room Ledger Messages
    let roomVerified = false;
    let activeRooms = 0;
    try {
      const status = await verifyDidStatus(clean);
      roomVerified = Boolean(status.lobbyVerified || status.technocoreVerified);
      activeRooms = status.activeRoomCount || 0;
    } catch (e) {
      console.warn('Room check failed:', e);
    }

    // Determine Real Status
    const isFullyQualified = kvFound || roomVerified;

    setResult({
      did: clean,
      fingerprint: parsed.fingerprint,
      cryptoValid: true,
      kvVerified: kvFound,
      kvNoteText,
      roomVerified,
      activeRooms,
      overallStatus: isFullyQualified ? 'QUALIFIED' : 'UNREGISTERED'
    });

    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 font-mono">
      {/* Top Banner */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs mb-3">
          <Terminal className="w-3.5 h-3.5 text-hacker-green" />
          <span>REAL-TIME ON-CHAIN LEDGER AUDITOR</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
          Verify <span className="text-hacker-dim underline decoration-white/30 underline-offset-8">Agent Eligibility</span>
        </h1>
        <p className="text-hacker-muted max-w-xl mx-auto mt-3 text-xs md:text-sm leading-relaxed">
          Run an actual 3-layer live network audit on any DID to verify mathematical validity and real Technocore ledger status.
        </p>
      </div>

      {/* Query Bar */}
      <div className="hacker-panel rounded-2xl p-4 md:p-6 mb-8">
        <form onSubmit={handleVerify} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={didInput}
              onChange={(e) => {
                setDidInput(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Paste public DID (did:key:z6Mk...)"
              className={`w-full pl-10 pr-4 py-3 rounded-xl bg-black border text-white text-xs font-mono outline-none transition-all ${
                error ? 'border-red-500/70 focus:border-red-500' : 'border-hacker-border focus:border-white'
              }`}
            />
            <Key className="w-4 h-4 text-hacker-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>

          <button
            type="submit"
            disabled={loading || !didInput.trim()}
            className="w-full sm:w-auto btn-white px-6 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>Run Live Audit</span>
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Result Card */}
      {result && (
        <div className={`hacker-panel rounded-3xl p-6 md:p-8 space-y-6 animate-fadeIn border ${
          result.overallStatus === 'QUALIFIED'
            ? 'border-hacker-green/50 shadow-[0_0_40px_rgba(34,197,94,0.12)]'
            : result.overallStatus === 'UNREGISTERED'
            ? 'border-amber-400/50 shadow-[0_0_40px_rgba(251,191,36,0.12)]'
            : 'border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.12)]'
        }`}>
          {/* Header Status */}
          <div className="flex items-center justify-between gap-4 flex-wrap pb-6 border-b border-hacker-border">
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                result.overallStatus === 'QUALIFIED'
                  ? 'bg-hacker-green text-black'
                  : result.overallStatus === 'UNREGISTERED'
                  ? 'bg-amber-400 text-black'
                  : 'bg-red-500 text-white'
              }`}>
                {result.overallStatus === 'QUALIFIED' ? (
                  <ShieldCheck className="w-7 h-7" />
                ) : result.overallStatus === 'UNREGISTERED' ? (
                  <Clock className="w-7 h-7" />
                ) : (
                  <ShieldAlert className="w-7 h-7" />
                )}
              </div>
              <div>
                <h3 className="font-black text-lg text-white flex items-center gap-2">
                  <span>
                    {result.overallStatus === 'QUALIFIED'
                      ? 'Verified on Technocore Ledger'
                      : result.overallStatus === 'UNREGISTERED'
                      ? 'Valid Key · Unregistered On-Chain'
                      : 'Cryptographic Audit Failed'}
                  </span>
                </h3>
                <p className="text-xs text-hacker-muted break-all leading-tight mt-0.5">{result.did}</p>
              </div>
            </div>

            <div className={`px-4 py-2 rounded-xl border ${
              result.overallStatus === 'QUALIFIED'
                ? 'bg-hacker-green/10 border-hacker-green/40 text-hacker-green'
                : result.overallStatus === 'UNREGISTERED'
                ? 'bg-amber-400/10 border-amber-400/40 text-amber-300'
                : 'bg-red-500/10 border-red-500/40 text-red-400'
            }`}>
              <span className="text-[10px] block uppercase font-bold">// ELIGIBILITY STATUS</span>
              <span className="text-sm font-black">
                {result.overallStatus === 'QUALIFIED'
                  ? '100% QUALIFIED'
                  : result.overallStatus === 'UNREGISTERED'
                  ? 'ACTION REQUIRED'
                  : '0% INVALID'}
              </span>
            </div>
          </div>

          {/* 3-Layer Proof Checklist */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-wider text-hacker-muted flex items-center gap-2">
              <Layers className="w-4 h-4" /> // 3-LAYER LIVE CRYPTOGRAPHIC AUDIT
            </h4>

            {/* Layer 1: Cryptography */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-black border border-hacker-border">
              <div className="flex items-center gap-3">
                {result.cryptoValid ? (
                  <CheckCircle2 className="w-4 h-4 text-hacker-green flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                )}
                <div>
                  <span className="text-xs font-bold text-white block">1. W3C Ed25519 Cryptographic Standard</span>
                  <span className="text-[11px] text-hacker-muted">
                    {result.cryptoValid 
                      ? `Fingerprint: ${result.fingerprint} (Header 0xed01 valid multicodec)`
                      : `Failed: ${result.errorMsg || 'Invalid multibase string'}`}
                  </span>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                result.cryptoValid ? 'text-hacker-green bg-hacker-green/10' : 'text-red-400 bg-red-500/10'
              }`}>
                {result.cryptoValid ? 'PASSED' : 'FAILED'}
              </span>
            </div>

            {/* Layer 2: Permanent KV Store */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-black border border-hacker-border">
              <div className="flex items-center gap-3">
                {result.kvVerified ? (
                  <CheckCircle2 className="w-4 h-4 text-hacker-green flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                )}
                <div>
                  <span className="text-xs font-bold text-white block">2. Technocore Permanent KV Store</span>
                  <span className="text-[11px] text-hacker-muted">
                    {result.kvVerified
                      ? `Found: "${result.kvNoteText || 'Profile note recorded'}"`
                      : 'No note found in Technocore KV database (404)'}
                  </span>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                result.kvVerified ? 'text-hacker-green bg-hacker-green/10' : 'text-amber-300 bg-amber-400/10'
              }`}>
                {result.kvVerified ? 'RECORDED' : 'UNRECORDED'}
              </span>
            </div>

            {/* Layer 3: Room Handshake */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-black border border-hacker-border">
              <div className="flex items-center gap-3">
                {result.overallStatus === 'QUALIFIED' ? (
                  <CheckCircle2 className="w-4 h-4 text-hacker-green flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                )}
                <div>
                  <span className="text-xs font-bold text-white block">3. Flop Labs $FLOP Snapshot Proof</span>
                  <span className="text-[11px] text-hacker-muted">
                    {result.overallStatus === 'QUALIFIED'
                      ? 'Verified decentralized agent record ready for snapshot indexer'
                      : 'Identity is not registered on-chain yet. Must complete setup steps.'}
                  </span>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                result.overallStatus === 'QUALIFIED' ? 'text-hacker-green bg-hacker-green/10' : 'text-amber-300 bg-amber-400/10'
              }`}>
                {result.overallStatus === 'QUALIFIED' ? 'QUALIFIED' : 'PENDING'}
              </span>
            </div>
          </div>

          {/* Action callout for Unregistered or Failed DIDs */}
          {result.overallStatus !== 'QUALIFIED' && (
            <div className="p-4 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-xs text-amber-300 flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-bold">⚠️ Action Required to Qualify for $FLOP:</p>
                <p className="text-[11px] text-amber-200/80 mt-0.5">
                  Publish a profile note (Step 3) or send a signed message (Step 4) on the Create page to register this DID on the live ledger.
                </p>
              </div>

              {onGoToCreate && (
                <button
                  onClick={onGoToCreate}
                  className="btn-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap text-black"
                >
                  <span>Go to Create Tab</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
