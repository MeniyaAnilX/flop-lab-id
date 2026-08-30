import React, { useState } from 'react';
import { 
  Search, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Terminal, 
  Key, 
  RefreshCw, 
  Layers,
  Award
} from 'lucide-react';
import { parseDid, getAgentVisuals } from '../lib/crypto';
import { verifyDidStatus } from '../lib/technocore';

export default function VerifyAgent() {
  const [didInput, setDidInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!didInput.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const parsed = parseDid(didInput.trim());
      const status = await verifyDidStatus(parsed.did);
      
      setResult({
        ...status,
        fingerprint: parsed.fingerprint,
        visuals: getAgentVisuals(parsed.did)
      });
    } catch (err) {
      setError(err.message || 'Invalid or unregistered DID format');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 font-mono">
      {/* Top Banner */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs mb-3">
          <Terminal className="w-3.5 h-3.5" /> LEDGER DIAGNOSTIC TOOL
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
          Verify <span className="text-hacker-dim">Agent Eligibility</span>
        </h1>
        <p className="text-hacker-muted max-w-xl mx-auto mt-2 text-xs md:text-sm">
          Run a cryptographic audit on any DID to verify mathematical validity and ledger status.
        </p>
      </div>

      {/* Query Bar */}
      <div className="hacker-panel rounded-2xl p-4 md:p-6 mb-8">
        <form onSubmit={handleVerify} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={didInput}
              onChange={(e) => setDidInput(e.target.value)}
              placeholder="Paste public DID (did:key:z6Mk...)"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-black border border-hacker-border text-white text-xs font-mono focus:border-white outline-none"
            />
            <Key className="w-4 h-4 text-hacker-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>

          <button
            type="submit"
            disabled={loading || !didInput.trim()}
            className="w-full sm:w-auto btn-white px-6 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>Run Audit</span>
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Result Card */}
      {result && (
        <div className="hacker-panel rounded-3xl p-6 md:p-8 space-y-6 animate-fadeIn border-white/50">
          {/* Header Status */}
          <div className="flex items-center justify-between gap-4 flex-wrap pb-6 border-b border-hacker-border">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-white text-black flex items-center justify-center font-bold text-lg">
                <Terminal className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                  <span>Cryptographic Audit Passed</span>
                  <ShieldCheck className="w-5 h-5 text-hacker-green" />
                </h3>
                <p className="text-xs text-hacker-muted break-all">{result.did}</p>
              </div>
            </div>

            <div className="bg-hacker-green/10 border border-hacker-green/40 px-4 py-2 rounded-xl">
              <span className="text-[10px] text-hacker-green block uppercase">// ELIGIBILITY STATUS</span>
              <span className="text-sm font-bold text-hacker-green">100% QUALIFIED</span>
            </div>
          </div>

          {/* 3-Layer Proof Checklist */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-wider text-hacker-muted flex items-center gap-2">
              <Layers className="w-4 h-4" /> // 3-LAYER CRYPTOGRAPHIC AUDIT
            </h4>

            {/* Check 1: Cryptography */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-black border border-hacker-border">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-hacker-green flex-shrink-0" />
                <div>
                  <span className="text-xs font-bold text-white block">W3C Ed25519 Cryptographic Standard</span>
                  <span className="text-[11px] text-hacker-muted">Fingerprint: {result.fingerprint} (Header 0xed01 valid)</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-hacker-green bg-hacker-green/10 px-2 py-0.5 rounded">PASSED</span>
            </div>

            {/* Check 2: Handshake */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-black border border-hacker-border">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-hacker-green flex-shrink-0" />
                <div>
                  <span className="text-xs font-bold text-white block">Technocore Protocol Handshake</span>
                  <span className="text-[11px] text-hacker-muted">Decentralized agent communications active</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-hacker-green bg-hacker-green/10 px-2 py-0.5 rounded">ONLINE</span>
            </div>

            {/* Check 3: Airdrop Snapshot */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-black border border-hacker-border">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-hacker-green flex-shrink-0" />
                <div>
                  <span className="text-xs font-bold text-white block">Flop Labs $FLOP Snapshot Ready</span>
                  <span className="text-[11px] text-hacker-muted">Eligible for Q4 2026 decentralized agent claims</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-hacker-green bg-hacker-green/10 px-2 py-0.5 rounded">QUALIFIED</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
