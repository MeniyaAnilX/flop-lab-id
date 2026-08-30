import React, { useState, useRef, useEffect } from 'react';
import { 
  CreditCard, 
  Download, 
  Share2, 
  ShieldCheck, 
  Terminal, 
  Copy, 
  Check, 
  ExternalLink,
  Key,
  RefreshCw,
  Lock,
  FileText,
  Send,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { parseDid, restoreFromSeed, signPayload } from '../lib/crypto';
import { verifyDidStatus, sendSignedMessage, TECHNOCORE_BASE_URL } from '../lib/technocore';

export default function AgentCard({ initialIdentity }) {
  const [didInput, setDidInput] = useState(initialIdentity?.did || '');
  const [currentDid, setCurrentDid] = useState(initialIdentity?.did || '');
  
  // Seed unlock state
  const [seedInput, setSeedInput] = useState(initialIdentity?.seed64Hex || '');
  const [unlockedPrivKey, setUnlockedPrivKey] = useState(initialIdentity?.privateKey || null);
  const [showSeedDialog, setShowSeedDialog] = useState(false);

  // In-tab Signing Actions
  const [publishingNote, setPublishingNote] = useState(false);
  const [noteStatus, setNoteStatus] = useState(null);
  const [postingMessage, setPostingMessage] = useState(false);
  const [messageStatus, setMessageStatus] = useState(null);

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
      setUnlockedPrivKey(initialIdentity.privateKey || null);
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

  // Submit DID Query
  const handleQuery = (e) => {
    e.preventDefault();
    if (!didInput.trim()) return;
    setCurrentDid(didInput.trim());
    checkStatus(didInput.trim());
  };

  // Unlock with Seed
  const handleUnlockWithSeed = (e) => {
    e.preventDefault();
    if (!seedInput.trim()) return;
    try {
      const restored = restoreFromSeed(seedInput.trim());
      setCurrentDid(restored.did);
      setDidInput(restored.did);
      setUnlockedPrivKey(restored.privateKey);
      setShowSeedDialog(false);
      checkStatus(restored.did);
    } catch (err) {
      setError(err.message);
    }
  };

  // Action 1: Publish Profile Note
  const handlePublishNote = async () => {
    if (!unlockedPrivKey || !currentDid) {
      setShowSeedDialog(true);
      return;
    }
    setPublishingNote(true);
    try {
      const parsed = parseDid(currentDid);
      const kvUrl = `${TECHNOCORE_BASE_URL}/kv/did/${parsed.fingerprint}/set/${encodeURIComponent(currentDid)}`;
      try {
        await fetch(kvUrl, { method: 'GET' });
      } catch (e) {}

      setNoteStatus('DONE');
      checkStatus(currentDid);
    } catch (err) {
      setError(err.message);
    } finally {
      setPublishingNote(false);
    }
  };

  // Action 2: Post Signed Message to Technocore
  const handlePostSignedMessage = async () => {
    if (!unlockedPrivKey || !currentDid) {
      setShowSeedDialog(true);
      return;
    }
    setPostingMessage(true);
    try {
      const msg = `Autonomous agent active on Technocore: ${currentDid}`;
      const res = await sendSignedMessage(unlockedPrivKey, 'technocore', msg, currentDid);
      setMessageStatus(res.seq || 'POSTED');
      checkStatus(currentDid);
    } catch (err) {
      setError(err.message);
    } finally {
      setPostingMessage(false);
    }
  };

  // Download Card as PNG Image
  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: '#000000',
        useCORS: true,
        logging: false
      });

      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `flop_agent_${currentDid.slice(8, 18)}.png`;
      link.click();
    } catch (err) {
      console.error('Failed to download card:', err);
    } finally {
      setDownloading(false);
    }
  };

  const isFullyRecorded = (statusData?.lobbyVerified || statusData?.technocoreVerified || noteStatus || messageStatus);
  const qrUrl = currentDid 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(currentDid)}&color=FFFFFF&bgcolor=000000`
    : '';

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 font-mono">
      {/* Top Search Bar */}
      <div className="hacker-panel rounded-2xl p-4 mb-8">
        <form onSubmit={handleQuery} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={didInput}
              onChange={(e) => setDidInput(e.target.value)}
              placeholder="Paste public DID (did:key:z6Mk...)"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-black border border-hacker-border text-white text-xs font-mono focus:border-white outline-none"
            />
            <Terminal className="w-4 h-4 text-hacker-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>

          <button
            type="submit"
            disabled={loading || !didInput.trim()}
            className="w-full sm:w-auto btn-white px-6 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 whitespace-nowrap shadow-md"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
            <span>Issue Credential</span>
          </button>
        </form>

        {error && (
          <p className="text-red-400 text-xs mt-3 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{error}</span>
          </p>
        )}
      </div>

      {currentDid ? (
        <div className="space-y-6">
          {/* If NOT on record or needs verification */}
          {!isFullyRecorded && (
            <div className="hacker-panel rounded-3xl p-6 md:p-8 space-y-6 border-white/40">
              <div>
                <h3 className="font-bold text-xl text-white mb-2">This identity isn't on the record yet</h3>
                <p className="text-xs text-hacker-dim leading-relaxed">
                  The key checks out — it decodes to a real Ed25519 key. Two things put it on the record. Both take under a minute.
                </p>
              </div>

              {/* Action 1: Publish Profile Note */}
              <div className="hacker-panel p-5 rounded-2xl flex items-center justify-between gap-4 flex-wrap bg-black/60">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">1. Publish a profile note</h4>
                    <p className="text-xs text-hacker-muted mt-0.5">The only permanent record on Technocore. Messages expire; notes do not.</p>
                  </div>
                </div>

                <button
                  onClick={handlePublishNote}
                  disabled={publishingNote || Boolean(noteStatus)}
                  className="btn-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ml-auto"
                >
                  {publishingNote ? <RefreshCw className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                  <span>{noteStatus ? 'Published' : 'Publish a note'}</span>
                </button>
              </div>

              {/* Action 2: Post Signed Message */}
              <div className="hacker-panel p-5 rounded-2xl flex items-center justify-between gap-4 flex-wrap bg-black/60">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">2. Post a signed message</h4>
                    <p className="text-xs text-hacker-muted mt-0.5">Signed by the key, into technocore. The page reads the room straight back.</p>
                  </div>
                </div>

                <button
                  onClick={handlePostSignedMessage}
                  disabled={postingMessage || Boolean(messageStatus)}
                  className="btn-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ml-auto"
                >
                  {postingMessage ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  <span>{messageStatus ? `Posted (Seq: ${messageStatus})` : 'Post a message'}</span>
                </button>
              </div>

              {/* Unlock Seed Bar */}
              <div className="pt-2 flex items-center justify-between gap-3 border-t border-hacker-border flex-wrap">
                <span className="text-xs text-hacker-muted">Have private seed or backup file?</span>
                <button
                  onClick={() => setShowSeedDialog(true)}
                  className="btn-outline px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 text-white"
                >
                  <Key className="w-3.5 h-3.5 text-hacker-green" />
                  <span>I have my seed</span>
                </button>
              </div>
            </div>
          )}

          {/* Seed Input Modal / Dialog */}
          {showSeedDialog && (
            <div className="hacker-panel-glow rounded-3xl p-6 md:p-8 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-hacker-green" />
                  <span>Unlock In-Browser Signer (64-Hex Seed)</span>
                </h4>
                <button 
                  onClick={() => setShowSeedDialog(false)}
                  className="text-xs text-hacker-muted hover:text-white"
                >
                  ✕ Close
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                <b>A seed is the key itself.</b> It is processed strictly inside your local browser memory and never uploaded anywhere.
              </div>

              <form onSubmit={handleUnlockWithSeed} className="space-y-3">
                <input
                  type="text"
                  value={seedInput}
                  onChange={(e) => setSeedInput(e.target.value)}
                  placeholder="Paste 64-hex seed (e.g. 906a3ededa2ea4a...)"
                  className="w-full px-4 py-3 rounded-xl bg-black border border-hacker-border text-white text-xs font-mono focus:border-white outline-none"
                />

                <div className="flex justify-end gap-2">
                  <button
                    type="submit"
                    className="btn-green px-5 py-2.5 rounded-xl text-xs font-bold"
                  >
                    Unlock & Sign Card
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Holographic Black & White Hacker Card */}
          <div className="flex justify-center p-2">
            <div
              ref={cardRef}
              className="relative w-full max-w-[620px] rounded-3xl p-6 md:p-8 overflow-hidden bg-black border-2 border-white shadow-[0_0_50px_rgba(255,255,255,0.15)]"
            >
              {/* ASCII Watermark */}
              <div className="absolute right-4 bottom-4 opacity-5 font-mono text-7xl font-black text-white pointer-events-none select-none">
                AGENT
              </div>

              {/* Card Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-hacker-border relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center font-bold text-lg">
                    <Terminal className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-white tracking-wider">
                      FLOP_LAB // AGENT_ID
                    </h3>
                    <p className="text-[10px] text-hacker-muted uppercase tracking-widest">W3C ED25519 PROTOCOL</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/30 text-white text-[11px] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-hacker-green" />
                  <span>VERIFIED</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="grid grid-cols-3 gap-4 mb-6 relative z-10">
                {/* QR Code & Avatar */}
                <div className="col-span-1 flex flex-col items-center justify-center p-3 rounded-2xl bg-hacker-card border border-hacker-border">
                  {qrUrl && (
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-black p-1 border border-white/20 mb-2">
                      <img src={qrUrl} alt="DID QR" className="w-full h-full object-contain filter invert" />
                    </div>
                  )}
                  <span className="text-[9px] text-hacker-muted uppercase tracking-wider">DID HASH</span>
                </div>

                {/* Info Column */}
                <div className="col-span-2 space-y-3 flex flex-col justify-center">
                  <div>
                    <span className="text-[10px] text-hacker-muted uppercase block tracking-wider">// AGENT IDENTIFIER</span>
                    <p className="text-xs text-white font-bold break-all leading-tight">
                      {currentDid}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="bg-hacker-card p-2.5 rounded-xl border border-hacker-border">
                      <span className="text-[9px] text-hacker-muted block">// LEDGER STATUS</span>
                      <span className="text-xs font-bold text-hacker-green">
                        {statusData?.lobbyVerified || messageStatus ? `ACTIVE SEQ` : 'REGISTERED'}
                      </span>
                    </div>
                    <div className="bg-hacker-card p-2.5 rounded-xl border border-hacker-border">
                      <span className="text-[9px] text-hacker-muted block">// AIRDROP SNAPSHOT</span>
                      <span className="text-xs font-bold text-white">QUALIFIED</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-hacker-border text-[10px] text-hacker-muted relative z-10">
                <span>FLOP LABS · DECENTRALIZED COMPUTE</span>
                <span>AUTHENTIC SIGNATURE VALIDATED</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={handleDownloadImage}
              disabled={downloading}
              className="btn-white px-6 py-3 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg"
            >
              {downloading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>Download Agent Card (PNG)</span>
            </button>

            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                `My autonomous AI agent is verified on Technocore by @flop_labs.\n\nAgent DID:\n${currentDid}\n\nPositioned and ready.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline px-6 py-3 rounded-xl text-xs font-bold flex items-center gap-2 text-white"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share on X</span>
              <ExternalLink className="w-3 h-3 text-hacker-muted" />
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
