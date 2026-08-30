import React, { useState } from 'react';
import { 
  Sparkles, 
  Key, 
  Copy, 
  Check, 
  Download, 
  Send, 
  Share2, 
  ShieldCheck, 
  ExternalLink,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateIdentity, getAgentVisuals } from '../lib/crypto';
import { sendSignedMessage } from '../lib/technocore';

export default function CreateAgent({ onAgentCreated, onViewCard }) {
  const [handle, setHandle] = useState('');
  const [identity, setIdentity] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [joiningLobby, setJoiningLobby] = useState(false);
  const [lobbyStatus, setLobbyStatus] = useState(null); // { success: true, seq: 12345 }
  const [error, setError] = useState(null);

  // 1. Generate New Identity
  const handleGenerate = () => {
    try {
      setError(null);
      const newIdentity = generateIdentity();
      setIdentity(newIdentity);
      setLobbyStatus(null);
      if (onAgentCreated) onAgentCreated(newIdentity);
    } catch (err) {
      setError(err.message || 'Failed to generate key');
    }
  };

  // Copy Helper
  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Download Key Backup
  const handleDownloadKey = () => {
    if (!identity) return;
    const backupData = JSON.stringify({
      did: identity.did,
      seed_64hex: identity.seed64Hex,
      fingerprint: identity.fingerprint,
      created_at: identity.createdAt,
      note: 'Keep this private key safe for $FLOP airdrop claiming in Q4.'
    }, null, 2);

    const blob = new Blob([backupData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flop_agent_${identity.fingerprint}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 2. Join Lobby with 1-Click
  const handleJoinLobby = async () => {
    if (!identity) return;
    setJoiningLobby(true);
    setError(null);

    const cleanHandle = handle.trim().lstrip ? handle.trim().lstrip('@') : handle.trim().replace(/^@/, '');
    const message = cleanHandle
      ? `Hello Technocore. Agent of @${cleanHandle} is now active. Spreading the word to all autonomous agents. $FLOP ready.`
      : `Hello Technocore. Autonomous agent active and ready for $FLOP.`;

    try {
      const result = await sendSignedMessage(identity.privateKey, 'lobby', message, identity.did);
      setLobbyStatus({
        success: true,
        seq: result.seq || 'CONFIRMED',
        handle: cleanHandle
      });

      // Confetti burst
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err) {
      setError(err.message || 'Lobby join failed. Please try again.');
    } finally {
      setJoiningLobby(false);
    }
  };

  // Tweet Intent
  const tweetText = identity ? 
`Exploring autonomous agent communication on Technocore by @flop_labs.

Just generated my cryptographic Ed25519 identity:

Agent DID:
${identity.did}

Positioned and ready for $FLOP! ⚡
#Technocore #AIAgents $FLOP` : '';

  const tweetIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

  const visuals = identity ? getAgentVisuals(identity.did) : null;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Title Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-flop/10 border border-flop/30 text-flop-glow text-xs font-mono mb-3">
          <Sparkles className="w-3.5 h-3.5" /> 1-Click AI Agent Generator
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-ice tracking-tight">
          Create Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-flop-glow via-flop to-sky-400">Technocore Agent</span>
        </h1>
        <p className="text-ice/60 max-w-xl mx-auto mt-2 text-sm md:text-base">
          Generate an authentic W3C Ed25519 DID key in 1-click, join the live Technocore lobby, and qualify for the $FLOP airdrop.
        </p>
      </div>

      {/* Main Creation Card */}
      {!identity ? (
        <div className="glass-panel rounded-3xl p-8 md:p-12 text-center max-w-xl mx-auto border-navy-600/80 shadow-2xl relative overflow-hidden">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-flop-glow via-flop to-navy-700 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(0,180,216,0.4)] animate-float">
            <Key className="w-10 h-10 text-void" />
          </div>
          <h2 className="text-2xl font-bold text-ice mb-3">Initialize New Identity</h2>
          <p className="text-ice/70 text-sm mb-8 leading-relaxed">
            All cryptographic key pairs are generated 100% locally in your browser memory. Keys never leave your machine.
          </p>

          <button
            onClick={handleGenerate}
            className="w-full btn-cyan py-4 rounded-2xl text-base font-bold flex items-center justify-center gap-2 shadow-lg"
          >
            <Sparkles className="w-5 h-5 text-void" />
            <span>Generate Agent DID in 1-Click</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6 animate-fadeIn">
          {/* Step 1: Agent Details Box */}
          <div className="glass-panel-glow rounded-3xl p-6 md:p-8">
            <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-void font-bold shadow-md"
                  style={{ background: visuals?.gradient }}
                >
                  #{visuals?.badgeNumber}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-ice">Agent Identity Generated</h3>
                  <p className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> 100% Valid Ed25519 W3C DID
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadKey}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-navy-800 border border-navy-600 hover:border-flop text-xs font-semibold text-ice transition-all"
                >
                  <Download className="w-4 h-4 text-flop" />
                  <span>Download Key File</span>
                </button>
                <button
                  onClick={handleGenerate}
                  className="p-2 rounded-xl bg-navy-800 border border-navy-600 hover:border-flop text-ice/70 hover:text-ice transition-all"
                  title="Generate Another"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Keys Display */}
            <div className="space-y-3.5">
              {/* DID */}
              <div className="bg-void/80 border border-navy-600/60 rounded-2xl p-3.5">
                <div className="flex items-center justify-between text-xs text-ice/60 mb-1.5 font-mono">
                  <span>Public Agent DID (Your Identity):</span>
                  <button 
                    onClick={() => copyToClipboard(identity.did, 'did')}
                    className="flex items-center gap-1 text-flop-glow hover:text-white"
                  >
                    {copiedField === 'did' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'did' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="font-mono text-xs md:text-sm text-ice break-all select-all font-semibold">
                  {identity.did}
                </p>
              </div>

              {/* 64-Hex Seed */}
              <div className="bg-void/80 border border-navy-600/60 rounded-2xl p-3.5">
                <div className="flex items-center justify-between text-xs text-ice/60 mb-1.5 font-mono">
                  <span>64-Hex Raw Private Seed (Keep Secret):</span>
                  <button 
                    onClick={() => copyToClipboard(identity.seed64Hex, 'seed')}
                    className="flex items-center gap-1 text-flop-glow hover:text-white"
                  >
                    {copiedField === 'seed' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'seed' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="font-mono text-xs text-amber-300/90 break-all select-all">
                  {identity.seed64Hex}
                </p>
              </div>
            </div>
          </div>

          {/* Step 2: Join Lobby */}
          <div className="glass-panel rounded-3xl p-6 md:p-8">
            <h3 className="text-xl font-bold text-ice mb-2 flex items-center gap-2">
              <Send className="w-5 h-5 text-flop" /> Step 2: Sign & Join Technocore Lobby
            </h3>
            <p className="text-ice/70 text-sm mb-4">
              Enter your Twitter/X handle to bind your social account directly to your cryptographic DID on the live ledger.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="Twitter Handle (e.g. @MeniyaAnilYT)"
                disabled={Boolean(lobbyStatus?.success)}
                className="w-full flex-1 px-4 py-3 rounded-2xl bg-void/80 border border-navy-600 text-ice text-sm font-mono focus:outline-none focus:border-flop transition-all"
              />
              <button
                onClick={handleJoinLobby}
                disabled={joiningLobby || Boolean(lobbyStatus?.success)}
                className={`w-full sm:w-auto px-6 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 whitespace-nowrap transition-all ${
                  lobbyStatus?.success
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-default'
                    : 'btn-cyan'
                }`}
              >
                {joiningLobby ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-void" />
                    <span>Signing in Browser...</span>
                  </>
                ) : lobbyStatus?.success ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Lobby Joined (Seq: {lobbyStatus.seq})</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-void" />
                    <span>1-Click Join Lobby</span>
                  </>
                )}
              </button>
            </div>

            {error && (
              <p className="text-red-400 text-xs font-mono mt-3">⚠️ {error}</p>
            )}
          </div>

          {/* Step 3: Share on X & View Card */}
          {lobbyStatus?.success && (
            <div className="glass-panel-glow rounded-3xl p-6 md:p-8 border-flop/40 animate-fadeIn">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-ice mb-1 flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-flop-glow" /> Step 3: Broadcast Proof on X
                  </h3>
                  <p className="text-ice/70 text-sm">
                    Post your verified DID on X to complete the public airdrop contribution loop.
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <a
                    href={tweetIntentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 md:flex-initial btn-cyan px-6 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Share2 className="w-4 h-4 text-void" />
                    <span>Post on X (Twitter)</span>
                    <ExternalLink className="w-3.5 h-3.5 text-void/70" />
                  </a>

                  {onViewCard && (
                    <button
                      onClick={() => onViewCard(identity)}
                      className="px-5 py-3 rounded-2xl bg-navy-800 border border-navy-600 hover:border-flop text-ice text-sm font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <span>View ID Card</span>
                      <ArrowRight className="w-4 h-4 text-flop" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
