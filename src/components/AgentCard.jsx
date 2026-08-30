import React, { useState, useRef, useEffect } from 'react';
import { 
  CreditCard, 
  Download, 
  Share2, 
  ShieldCheck, 
  Sparkles, 
  Copy, 
  Check, 
  ExternalLink,
  QrCode,
  Key,
  RefreshCw
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { parseDid, getAgentVisuals, restoreFromSeed } from '../lib/crypto';
import { verifyDidStatus } from '../lib/technocore';

export default function AgentCard({ initialIdentity }) {
  const [didInput, setDidInput] = useState(initialIdentity?.did || '');
  const [seedInput, setSeedInput] = useState(initialIdentity?.seed64Hex || '');
  const [currentDid, setCurrentDid] = useState(initialIdentity?.did || '');
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  const cardRef = useRef(null);

  useEffect(() => {
    if (initialIdentity?.did) {
      setCurrentDid(initialIdentity.did);
      setDidInput(initialIdentity.did);
      setSeedInput(initialIdentity.seed64Hex || '');
      checkStatus(initialIdentity.did);
    }
  }, [initialIdentity]);

  // Load Status
  const checkStatus = async (didToQuery) => {
    if (!didToQuery) return;
    setLoading(true);
    setError(null);
    try {
      parseDid(didToQuery);
      const res = await verifyDidStatus(didToQuery);
      setStatusData(res);
    } catch (err) {
      setError(err.message || 'Invalid DID');
    } finally {
      setLoading(false);
    }
  };

  // Submit DID Form
  const handleLoadDid = (e) => {
    e.preventDefault();
    if (seedInput.trim()) {
      try {
        const restored = restoreFromSeed(seedInput.trim());
        setCurrentDid(restored.did);
        setDidInput(restored.did);
        checkStatus(restored.did);
        return;
      } catch (err) {
        setError(err.message);
        return;
      }
    }

    if (didInput.trim()) {
      setCurrentDid(didInput.trim());
      checkStatus(didInput.trim());
    }
  };

  // Download Card as PNG Image
  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2.5,
        backgroundColor: '#00070A',
        useCORS: true,
        logging: false
      });

      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `flop_agent_card_${currentDid.slice(8, 18)}.png`;
      link.click();
    } catch (err) {
      console.error('Failed to download card:', err);
    } finally {
      setDownloading(false);
    }
  };

  const visuals = currentDid ? getAgentVisuals(currentDid) : null;
  const qrUrl = currentDid 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(currentDid)}&color=00B4D8&bgcolor=04141C`
    : '';

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-flop/10 border border-flop/30 text-flop-glow text-xs font-mono mb-3">
          <CreditCard className="w-3.5 h-3.5" /> Holographic Agent Passport
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-ice tracking-tight">
          Verifiable <span className="text-transparent bg-clip-text bg-gradient-to-r from-flop-glow via-flop to-sky-400">Agent ID Card</span>
        </h1>
        <p className="text-ice/60 max-w-xl mx-auto mt-2 text-sm md:text-base">
          Generate an official decentralized identity card showing your cryptographic status, DID key, and Technocore sequences.
        </p>
      </div>

      {/* Input Selector */}
      <div className="glass-panel rounded-3xl p-6 mb-8 border-navy-600/60">
        <form onSubmit={handleLoadDid} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-ice/70 mb-1.5">Paste Public DID:</label>
              <input
                type="text"
                value={didInput}
                onChange={(e) => {
                  setDidInput(e.target.value);
                  if (e.target.value) setSeedInput('');
                }}
                placeholder="did:key:z6Mk..."
                className="w-full px-4 py-2.5 rounded-xl bg-void/80 border border-navy-600 text-ice text-xs font-mono focus:border-flop outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-ice/70 mb-1.5">Or Paste 64-Hex Seed:</label>
              <input
                type="text"
                value={seedInput}
                onChange={(e) => {
                  setSeedInput(e.target.value);
                  if (e.target.value) setDidInput('');
                }}
                placeholder="64-Hex Private Seed..."
                className="w-full px-4 py-2.5 rounded-xl bg-void/80 border border-navy-600 text-amber-300 text-xs font-mono focus:border-flop outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 pt-1 flex-wrap">
            {error && <span className="text-xs text-red-400 font-mono">⚠️ {error}</span>}
            <button
              type="submit"
              disabled={loading || (!didInput && !seedInput)}
              className="btn-cyan ml-auto px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Render Agent Card</span>
            </button>
          </div>
        </form>
      </div>

      {/* Holographic ID Card Preview */}
      {currentDid ? (
        <div className="space-y-6">
          {/* Card Container for HTML2Canvas */}
          <div className="flex justify-center p-2">
            <div
              ref={cardRef}
              className="relative w-full max-w-[620px] rounded-3xl p-6 md:p-8 overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,180,216,0.3)] border border-flop/40 transition-transform duration-300"
              style={{
                background: 'linear-gradient(145deg, #04141C 0%, #072230 50%, #001A24 100%)'
              }}
            >
              {/* Card Ambient Glow / Watermark */}
              <div 
                className="absolute -right-16 -top-16 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none"
                style={{ background: visuals?.accent || '#00B4D8' }}
              />
              <div className="absolute right-6 top-6 opacity-10 font-black text-8xl text-flop pointer-events-none select-none">
                FLOP
              </div>

              {/* Card Header */}
              <div className="flex items-center justify-between mb-6 relative z-10 border-b border-navy-600/50 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-flop-glow via-flop to-navy-800 flex items-center justify-center shadow-md">
                    <Sparkles className="w-5 h-5 text-void" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-ice tracking-tight flex items-center gap-1.5">
                      TECHNOCORE <span className="text-flop">AGENT PASS</span>
                    </h3>
                    <p className="text-[10px] font-mono text-flop-glow tracking-widest">FLOP LABS ECOSYSTEM</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>VERIFIED AGENT</span>
                </div>
              </div>

              {/* Card Body Grid */}
              <div className="grid grid-cols-3 gap-4 mb-6 relative z-10">
                {/* Left: Avatar Badge */}
                <div className="col-span-1 flex flex-col items-center justify-center p-4 rounded-2xl bg-void/60 border border-navy-600/60 shadow-inner">
                  <div 
                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-void font-extrabold text-xl shadow-lg mb-2 relative overflow-hidden"
                    style={{ background: visuals?.gradient }}
                  >
                    <span className="relative z-10">#{visuals?.badgeNumber}</span>
                    <div className="absolute inset-0 bg-white/10 opacity-50 transform -rotate-45" />
                  </div>
                  <span className="text-[10px] font-mono text-ice/60 uppercase">Avatar ID</span>
                </div>

                {/* Right: DID & Info */}
                <div className="col-span-2 space-y-2.5 flex flex-col justify-center">
                  <div>
                    <span className="text-[10px] font-mono text-flop uppercase tracking-wider block">Decentralized Identifier (DID):</span>
                    <p className="font-mono text-xs md:text-sm text-ice font-bold break-all leading-tight">
                      {visuals?.shortDid}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="bg-void/40 p-2 rounded-xl border border-navy-700/60">
                      <span className="text-[9px] font-mono text-ice/50 block">LOBBY STATUS</span>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {statusData?.lobbyVerified ? `Seq #${statusData.lobbySeq}` : 'ACTIVE HANDSHAKE'}
                      </span>
                    </div>
                    <div className="bg-void/40 p-2 rounded-xl border border-navy-700/60">
                      <span className="text-[9px] font-mono text-ice/50 block">AIRDROP STATUS</span>
                      <span className="text-xs font-mono font-bold text-flop-glow">100% READY</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer with QR Code */}
              <div className="flex items-center justify-between gap-4 pt-3 border-t border-navy-600/40 relative z-10 text-[11px] font-mono text-ice/60">
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-flop/80">W3C Ed25519 Cryptographic Standard</p>
                  <p className="text-[11px] text-ice/80 font-bold">FLOP LABS · AUTONOMOUS AGENT ECONOMY</p>
                </div>
                {qrUrl && (
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-flop/40 bg-void p-0.5 shadow-md flex-shrink-0">
                    <img src={qrUrl} alt="DID QR Code" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={handleDownloadImage}
              disabled={downloading}
              className="btn-cyan px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-lg"
            >
              {downloading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-void" />
                  <span>Rendering Image...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-void" />
                  <span>Download Card (PNG)</span>
                </>
              )}
            </button>

            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                `My autonomous AI agent is verified on Technocore by @flop_labs.\n\nAgent DID:\n${currentDid}\n\n$FLOP Airdrop Ready! ⚡ #Technocore #AIAgents`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-2xl bg-navy-800 border border-navy-600 hover:border-flop text-ice text-sm font-semibold flex items-center gap-2 transition-all"
            >
              <Share2 className="w-4 h-4 text-flop" />
              <span>Share on X</span>
              <ExternalLink className="w-3.5 h-3.5 text-ice/50" />
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
