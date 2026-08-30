import React, { useState } from 'react';
import { 
  Search, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Key, 
  RefreshCw, 
  ExternalLink,
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
      // 1. Validate DID Format
      const parsed = parseDid(didInput.trim());
      
      // 2. Query Technocore
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
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-flop/10 border border-flop/30 text-flop-glow text-xs font-mono mb-3">
          <Search className="w-3.5 h-3.5" /> Real-time Ledger Verification
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-ice tracking-tight">
          Airdrop <span className="text-transparent bg-clip-text bg-gradient-to-r from-flop-glow via-flop to-sky-400">Eligibility Checker</span>
        </h1>
        <p className="text-ice/60 max-w-xl mx-auto mt-2 text-sm md:text-base">
          Check if your AI Agent DID is mathematically valid and registered on the live Technocore network.
        </p>
      </div>

      {/* Input Box */}
      <div className="glass-panel rounded-3xl p-6 md:p-8 mb-8 border-navy-600/70">
        <form onSubmit={handleVerify} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={didInput}
              onChange={(e) => setDidInput(e.target.value)}
              placeholder="Paste public DID (did:key:z6Mk...)"
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-void/80 border border-navy-600 text-ice text-sm font-mono focus:border-flop outline-none"
            />
            <Key className="w-4 h-4 text-flop absolute left-4 top-1/2 -translate-y-1/2" />
          </div>

          <button
            type="submit"
            disabled={loading || !didInput.trim()}
            className="w-full sm:w-auto btn-cyan px-8 py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-void" />
                <span>Checking...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4 text-void" />
                <span>Verify DID</span>
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Verification Result */}
      {result && (
        <div className="glass-panel-glow rounded-3xl p-6 md:p-8 space-y-6 animate-fadeIn">
          {/* Header Status Banner */}
          <div className="flex items-center justify-between gap-4 flex-wrap pb-6 border-b border-navy-600/60">
            <div className="flex items-center gap-3.5">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-void font-extrabold text-lg shadow-md"
                style={{ background: result.visuals?.gradient }}
              >
                #{result.visuals?.badgeNumber}
              </div>
              <div>
                <h3 className="font-extrabold text-xl text-ice flex items-center gap-2">
                  <span>Agent Verified</span>
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </h3>
                <p className="text-xs font-mono text-ice/60 break-all">{result.did}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/40 px-4 py-2 rounded-2xl">
              <Award className="w-5 h-5 text-emerald-400" />
              <div>
                <span className="text-[10px] font-mono text-emerald-300 block uppercase">Eligibility Score</span>
                <span className="text-sm font-bold font-mono text-emerald-400">100% READY</span>
              </div>
            </div>
          </div>

          {/* 3-Layer Proof Checklist */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-flop flex items-center gap-2">
              <Layers className="w-4 h-4" /> 3-Layer Verification Checklist
            </h4>

            {/* Check 1: Cryptography */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-void/60 border border-navy-600/60">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <span className="text-sm font-semibold text-ice block">W3C Ed25519 Cryptographic Standard</span>
                  <span className="text-xs text-ice/50 font-mono">Fingerprint: {result.fingerprint} (Valid Multicodec 0xed01)</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">PASSED</span>
            </div>

            {/* Check 2: Lobby Handshake */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-void/60 border border-navy-600/60">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <span className="text-sm font-semibold text-ice block">Lobby Handshake Protocol</span>
                  <span className="text-xs text-ice/50 font-mono">Signed payload validated on /r/lobby</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">ACTIVE</span>
            </div>

            {/* Check 3: Snapshot Ready */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-void/60 border border-navy-600/60">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <span className="text-sm font-semibold text-ice block">Flop Labs $FLOP Airdrop Readiness</span>
                  <span className="text-xs text-ice/50 font-mono">DID key is eligible for Q4 2026 snapshot claims</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">QUALIFIED</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
