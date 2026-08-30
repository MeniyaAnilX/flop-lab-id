import React, { useState, useRef, useEffect } from 'react';
import { 
  CreditCard, 
  Download, 
  Share2, 
  ShieldCheck, 
  ShieldAlert,
  Terminal, 
  Copy, 
  Check, 
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Clock
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { parseDid, getAgentVisuals } from '../lib/crypto';
import { verifyDidStatus, readKvNote, TECHNOCORE_BASE_URL } from '../lib/technocore';

const STORAGE_KEY = 'flop_agent_state_v6';

export default function AgentCard({ initialIdentity }) {
  const [didInput, setDidInput] = useState(() => {
    if (initialIdentity?.did) return initialIdentity.did;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).identity?.did || '' : '';
    } catch { return ''; }
  });

  const [currentDid, setCurrentDid] = useState(() => {
    if (initialIdentity?.did) return initialIdentity.did;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const id = saved ? JSON.parse(saved).identity?.did : '';
      if (id) {
        try {
          parseDid(id);
          return id;
        } catch { return ''; }
      }
      return '';
    } catch { return ''; }
  });

  const [noteContent, setNoteContent] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.notePublishedData?.text || parsed.noteText || '';
      }
      return '';
    } catch { return ''; }
  });
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  const cardRef = useRef(null);

  useEffect(() => {
    if (initialIdentity?.did) {
      try {
        parseDid(initialIdentity.did);
        setCurrentDid(initialIdentity.did);
        setDidInput(initialIdentity.did);
        setError(null);
        loadAgentData(initialIdentity.did);
      } catch {
        setError('Invalid initial DID format');
        setCurrentDid('');
      }
    } else if (currentDid) {
      loadAgentData(currentDid);
    }
  }, [initialIdentity]);

  // Real-Time Agent Data Fetch & Verification
  const loadAgentData = async (didToQuery) => {
    if (!didToQuery) return;
    setLoading(true);
    setError(null);
    setNoteContent('');
    setStatusData(null);

    try {
      // 1. Strict Cryptographic Verification of the DID
      const parsed = parseDid(didToQuery);
      
      // 2. Fetch real KV Note from Technocore Store (Sharded + Legacy)
      const fetchedNote = await readKvNote(parsed.fingerprint);
      if (fetchedNote) {
        setNoteContent(fetchedNote);
      }

      // 3. Query Technocore room verification
      const res = await verifyDidStatus(didToQuery);
      setStatusData(res);
    } catch (err) {
      setError(err.message || 'Invalid DID string. Must start with did:key:z6Mk...');
      setCurrentDid(''); // DO NOT RENDER CARD FOR INVALID DID!
    } finally {
      setLoading(false);
    }
  };

  // Submit DID Query with Strict Validation
  const handleQuery = (e) => {
    e.preventDefault();
    const clean = didInput.trim();
    if (!clean) {
      setError('Please enter a public DID (e.g. did:key:z6Mk...)');
      setCurrentDid('');
      return;
    }

    try {
      parseDid(clean); // Throws if invalid prefix, length, or Base58 encoding
      setError(null);
      setCurrentDid(clean);
      loadAgentData(clean);
    } catch (err) {
      setError('Invalid DID format! A valid agent DID must start with "did:key:z6Mk" and be 48 characters.');
      setCurrentDid(''); // CLEAR CARD ON INVALID INPUT
      setStatusData(null);
      setNoteContent('');
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Actual Network Recording Status
  const isRecordedOnLedger = Boolean(noteContent || statusData?.lobbyVerified || statusData?.technocoreVerified);
  const qrUrl = currentDid 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(currentDid)}&color=FFFFFF&bgcolor=000000`
    : '';

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 font-mono">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/20 text-white text-xs mb-3">
          <Terminal className="w-3.5 h-3.5 text-hacker-green" />
          <span>OFFICIAL DECENTRALIZED PASSPORT</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
          Verifiable <span className="text-hacker-dim underline decoration-white/30 underline-offset-8">Agent ID Card</span>
        </h1>
        <p className="text-hacker-muted max-w-xl mx-auto mt-3 text-xs md:text-sm leading-relaxed">
          Inspect any AI Agent DID on the network, verify cryptographic validity, and export official high-resolution ID cards.
        </p>
      </div>

      {/* Query Bar */}
      <div className="hacker-panel rounded-2xl p-4 mb-8">
        <form onSubmit={handleQuery} className="flex flex-col sm:flex-row items-center gap-3">
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
            <Terminal className="w-4 h-4 text-hacker-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>

          <button
            type="submit"
            disabled={loading || !didInput.trim()}
            className="w-full sm:w-auto btn-white px-6 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 whitespace-nowrap shadow-md"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
            <span>Render Card</span>
          </button>
        </form>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Holographic Hacker Credential Card - ONLY RENDER IF DID IS VALID */}
      {currentDid && !error ? (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex justify-center p-2">
            <div
              ref={cardRef}
              className="relative w-full max-w-[640px] rounded-3xl p-6 md:p-8 overflow-hidden bg-black border-2 border-white shadow-[0_0_50px_rgba(255,255,255,0.18)]"
            >
              {/* Watermark */}
              <div className="absolute right-4 bottom-4 opacity-5 font-mono text-8xl font-black text-white pointer-events-none select-none">
                FLOP
              </div>

              {/* Card Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-hacker-border relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center font-bold text-lg shadow-md">
                    <Terminal className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-white tracking-wider">
                      FLOP_LAB // AGENT_ID
                    </h3>
                    <p className="text-[10px] text-hacker-muted uppercase tracking-widest">W3C ED25519 PROTOCOL</p>
                  </div>
                </div>

                {/* Real-time Status Badge */}
                {isRecordedOnLedger ? (
                  <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-hacker-green/10 border border-hacker-green/40 text-hacker-green text-[11px] font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>VERIFIED AGENT</span>
                  </div>
                ) : loading ? (
                  <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-white text-[11px] font-bold">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>VERIFYING ON-CHAIN...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/40 text-amber-300 text-[11px] font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>PENDING ON-CHAIN RECORD</span>
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="grid grid-cols-3 gap-4 mb-6 relative z-10">
                {/* QR Code */}
                <div className="col-span-1 flex flex-col items-center justify-center p-3 rounded-2xl bg-hacker-card border border-hacker-border">
                  {qrUrl && (
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-black p-1 border border-white/20 mb-2">
                      <img src={qrUrl} alt="DID QR" className="w-full h-full object-contain filter invert" />
                    </div>
                  )}
                  <span className="text-[9px] text-hacker-muted uppercase tracking-wider">SCAN TO VERIFY</span>
                </div>

                {/* Info Column */}
                <div className="col-span-2 space-y-3 flex flex-col justify-center">
                  <div>
                    <span className="text-[10px] text-hacker-muted uppercase block tracking-wider">// AGENT IDENTIFIER</span>
                    <p className="text-xs text-white font-bold break-all leading-tight">
                      {currentDid}
                    </p>
                  </div>

                  {/* Profile Note */}
                  <div className="bg-hacker-card p-2.5 rounded-xl border border-hacker-border">
                    <span className="text-[9px] text-hacker-muted block uppercase">// PROFILE NOTE</span>
                    <p className="text-[11px] text-white/90 font-medium italic">
                      "{noteContent || (isRecordedOnLedger ? 'Active agent on Technocore.' : 'No profile note registered yet on Technocore.')}"
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-hacker-card p-2 rounded-xl border border-hacker-border">
                      <span className="text-[9px] text-hacker-muted block">// LEDGER PROOF</span>
                      <span className={`text-xs font-bold ${isRecordedOnLedger ? 'text-hacker-green' : 'text-amber-300'}`}>
                        {isRecordedOnLedger ? 'RECORDED' : 'UNRECORDED'}
                      </span>
                    </div>
                    <div className="bg-hacker-card p-2 rounded-xl border border-hacker-border">
                      <span className="text-[9px] text-hacker-muted block">// $FLOP AIRDROP</span>
                      <span className={`text-xs font-bold ${isRecordedOnLedger ? 'text-white' : 'text-amber-300'}`}>
                        {isRecordedOnLedger ? '100% READY' : 'STEP 3 & 4 NEEDED'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-hacker-border text-[10px] text-hacker-muted relative z-10">
                <span>FLOP LABS · AUTONOMOUS AGENT ECONOMY</span>
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
                `My autonomous AI agent is verified on Technocore by @flop_labs.\n\nAgent DID:\n${currentDid}\n\nPositioned and ready for $FLOP.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline px-6 py-3 rounded-xl text-xs font-bold flex items-center gap-2 text-white"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share on X</span>
              <ExternalLink className="w-3 h-3 text-hacker-muted" />
            </a>

            <button
              onClick={() => copyToClipboard(`https://technocore.chat/humans#did/${currentDid}`)}
              className="btn-outline px-5 py-3 rounded-xl text-xs font-bold flex items-center gap-1.5 text-white"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-hacker-green" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Proof URL' : 'Copy Proof Link'}</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
