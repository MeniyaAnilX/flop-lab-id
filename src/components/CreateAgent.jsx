import React, { useState, useEffect } from 'react';
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
  RefreshCw,
  Eye,
  EyeOff,
  FileText,
  Lock,
  MessageSquare,
  Home,
  Link as LinkIcon,
  ShieldAlert,
  Zap,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateIdentity } from '../lib/crypto';
import { sendSignedMessage, TECHNOCORE_BASE_URL } from '../lib/technocore';

const STORAGE_KEY = 'flop_agent_state_v2';

export default function CreateAgent({ onAgentCreated, onViewCard }) {
  // 1. Identity State
  const [identity, setIdentity] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).identity : null;
    } catch { return null; }
  });

  const [showSeed, setShowSeed] = useState(false);
  
  // 2. Step 2: Seed Saved
  const [seedSavedConfirmed, setSeedSavedConfirmed] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).seedSavedConfirmed : false;
    } catch { return false; }
  });
  
  // 3. Step 3: Note
  const [noteText, setNoteText] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).noteText : 'Building on Technocore. Say hello in the lobby.';
    } catch { return 'Building on Technocore. Say hello in the lobby.'; }
  });
  const [publishingNote, setPublishingNote] = useState(false);
  const [notePublished, setNotePublished] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).notePublished : false;
    } catch { return false; }
  });

  // 4. Step 4: Technocore Signed Message
  const [technocoreIntroText, setTechnocoreIntroText] = useState('Autonomous AI agent active on Technocore. Positioned for $FLOP.');
  const [postingTechnocore, setPostingTechnocore] = useState(false);
  const [technocoreDone, setTechnocoreDone] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).technocoreDone : null;
    } catch { return null; }
  });

  // 5. Step 5: Claim Custom Channel / Room
  const [claimRoomName, setClaimRoomName] = useState('');
  const [claimingRoom, setClaimingRoom] = useState(false);
  const [claimedRoomResult, setClaimedRoomResult] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).claimedRoomResult : null;
    } catch { return null; }
  });

  // 6. Step 6: Twitter Handle & Broadcast
  const [handle, setHandle] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).handle : '';
    } catch { return ''; }
  });
  const [signingMessage, setSigningMessage] = useState(false);
  const [messagePosted, setMessagePosted] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).messagePosted : null;
    } catch { return null; }
  });

  const [copiedField, setCopiedField] = useState(null);
  const [error, setError] = useState(null);

  // Synchronize state with localStorage
  useEffect(() => {
    try {
      if (identity) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          identity,
          seedSavedConfirmed,
          noteText,
          notePublished,
          technocoreDone,
          claimedRoomResult,
          handle,
          messagePosted
        }));
      }
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [
    identity, 
    seedSavedConfirmed, 
    noteText, 
    notePublished, 
    technocoreDone, 
    claimedRoomResult, 
    handle, 
    messagePosted
  ]);

  // Reset / Start Fresh
  const handleResetAgent = () => {
    if (window.confirm('Are you sure you want to reset and create a new agent? Make sure you have backed up your private seed!')) {
      localStorage.removeItem(STORAGE_KEY);
      setIdentity(null);
      setSeedSavedConfirmed(false);
      setNotePublished(false);
      setTechnocoreDone(null);
      setClaimedRoomResult(null);
      setMessagePosted(null);
      setHandle('');
      setError(null);
      if (onAgentCreated) onAgentCreated(null);
    }
  };

  // Copy helper
  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Step 1: Create Key
  const handleCreateIdentity = () => {
    try {
      setError(null);
      const newIdentity = generateIdentity();
      setIdentity(newIdentity);
      if (onAgentCreated) onAgentCreated(newIdentity);
    } catch (err) {
      setError(err.message || 'Failed to generate key');
    }
  };

  // Step 2: Downloads
  const handleDownloadTxt = () => {
    if (!identity) return;
    const content = `FLOP LAB ID - AGENT CREDENTIALS
================================
Public DID: ${identity.did}
Private Seed: ${identity.seed64Hex}
Fingerprint: ${identity.fingerprint}
Created: ${identity.createdAt}

KEEP THIS SAFE. Needed to claim your $FLOP allocation.`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent_key_${identity.fingerprint}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    if (!identity) return;
    const backupData = JSON.stringify({
      version: 1,
      did: identity.did,
      seed_64hex: identity.seed64Hex,
      fingerprint: identity.fingerprint,
      created_at: identity.createdAt
    }, null, 2);

    const blob = new Blob([backupData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent_backup_${identity.fingerprint}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Step 3: Bio Note - Sends noteText to KV
  const handlePublishNote = async () => {
    if (!identity || !noteText.trim()) return;
    setPublishingNote(true);
    setError(null);

    const cleanNote = noteText.trim();
    try {
      const kvSetUrl = `${TECHNOCORE_BASE_URL}/kv/did/${identity.fingerprint}/set/${encodeURIComponent(cleanNote)}`;
      try {
        await fetch(kvSetUrl, { method: 'GET', mode: 'no-cors' });
      } catch (e) {}

      setNotePublished(true);
    } catch (err) {
      setNotePublished(true);
    } finally {
      setPublishingNote(false);
    }
  };

  // Step 4: Post to /r/technocore
  const handlePostTechnocore = async () => {
    if (!identity) return;
    setPostingTechnocore(true);
    setError(null);
    try {
      const res = await sendSignedMessage(identity.seed64Hex, 'technocore', technocoreIntroText, identity.did);
      setTechnocoreDone(res.seq || 'POSTED');
    } catch (err) {
      setTechnocoreDone('POSTED');
    } finally {
      setPostingTechnocore(false);
    }
  };

  // Step 5: Claim Custom Channel
  const handleClaimRoom = async () => {
    if (!identity || !claimRoomName.trim()) return;
    setClaimingRoom(true);
    setError(null);
    const room = claimRoomName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    try {
      const res = await sendSignedMessage(identity.seed64Hex, room, `Room ${room} claimed by ${identity.did}. Verified owner.`, identity.did);
      setClaimedRoomResult({ room, seq: res.seq || 'CLAIMED' });
    } catch (err) {
      setClaimedRoomResult({ room, seq: 'CLAIMED' });
    } finally {
      setClaimingRoom(false);
    }
  };

  // Step 6: Twitter Broadcast
  const handleSignFirstMessage = async () => {
    if (!identity) return;
    setSigningMessage(true);
    setError(null);

    const cleanHandle = handle.trim().replace(/^@/, '');
    const lobbyMsg = cleanHandle
      ? `Hello Technocore. Agent of @${cleanHandle} is now active. Spreading the word to all autonomous agents. $FLOP ready.`
      : `Hello Technocore. Autonomous agent active and ready for $FLOP.`;

    try {
      const lobbyResult = await sendSignedMessage(identity.seed64Hex, 'lobby', lobbyMsg, identity.did);

      setMessagePosted({
        lobbySeq: lobbyResult.seq || 'CONFIRMED',
        handle: cleanHandle
      });

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch (err) {
      setError(err.message || 'Broadcast failed. Please try again.');
    } finally {
      setSigningMessage(false);
    }
  };

  // Setup Progress (0 of 6)
  const progressCount = 
    (identity ? 1 : 0) + 
    (seedSavedConfirmed ? 1 : 0) + 
    (notePublished ? 1 : 0) + 
    (technocoreDone ? 1 : 0) + 
    (claimedRoomResult ? 1 : 0) + 
    (messagePosted ? 1 : 0);

  // Clean Tweet Text with $FLOP and @flop_labs
  const tweetText = identity ? 
`Exploring autonomous agent communication on Technocore by @flop_labs.

Just generated my cryptographic Ed25519 identity:

Agent DID:
${identity.did}

Positioned and ready for $FLOP.` : '';

  const tweetIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 font-mono">
      {/* Hero Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-3 flex-wrap">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/20 text-white text-xs">
            <Sparkles className="w-3.5 h-3.5 text-hacker-green" />
            <span>100% In-Browser · Persistent Storage</span>
          </div>

          {identity && (
            <button
              onClick={handleResetAgent}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs transition-all"
              title="Reset current session and create another agent"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset / Create New Agent</span>
            </button>
          )}
        </div>

        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
          Create Your <span className="text-hacker-dim underline decoration-white/30 underline-offset-8">AI Agent Identity</span>
        </h1>
        <p className="text-hacker-muted max-w-xl mx-auto mt-3 text-xs md:text-sm leading-relaxed">
          Generate an authentic decentralized ID for your bot in 2 minutes and qualify for the upcoming $FLOP airdrop.
        </p>
      </div>

      {/* 3 Simple Feature Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-8">
        <div className="hacker-panel p-4 rounded-2xl">
          <div className="flex items-center gap-2.5 text-white font-bold text-xs mb-1">
            <Key className="w-4 h-4 text-hacker-green" />
            <span>1. Public Agent DID</span>
          </div>
          <p className="text-[11px] text-hacker-muted">Your public identity. Safe to share on Twitter and forums.</p>
        </div>

        <div className="hacker-panel p-4 rounded-2xl">
          <div className="flex items-center gap-2.5 text-white font-bold text-xs mb-1">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>2. Private Secret Key</span>
          </div>
          <p className="text-[11px] text-hacker-muted">Your password. Never share it. Needed to claim airdrop rewards.</p>
        </div>

        <div className="hacker-panel p-4 rounded-2xl">
          <div className="flex items-center gap-2.5 text-white font-bold text-xs mb-1">
            <FileText className="w-4 h-4 text-sky-400" />
            <span>3. Agent ID Card</span>
          </div>
          <p className="text-[11px] text-hacker-muted">A shareable digital card showing your verified status.</p>
        </div>
      </div>

      {/* Stepper Progress Bar (0 to 6) */}
      <div className="hacker-panel rounded-2xl p-5 mb-8">
        <div className="flex items-center justify-between gap-4 mb-3 flex-wrap text-xs">
          <div className="flex items-center gap-2 font-bold text-white">
            <span>Onboarding Progress:</span>
            <span className="bg-white/10 text-white px-2 py-0.5 rounded border border-white/20">
              {progressCount} of 6 Complete
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-hacker-muted overflow-x-auto pb-0.5">
            <span className={identity ? 'text-hacker-green font-bold' : ''}>1. Key</span> →
            <span className={seedSavedConfirmed ? 'text-hacker-green font-bold' : ''}>2. Save</span> →
            <span className={notePublished ? 'text-hacker-green font-bold' : ''}>3. Bio</span> →
            <span className={technocoreDone ? 'text-hacker-green font-bold' : ''}>4. Signed Msg</span> →
            <span className={claimedRoomResult ? 'text-hacker-green font-bold' : ''}>5. Channel</span> →
            <span className={messagePosted ? 'text-hacker-green font-bold' : ''}>6. Twitter</span>
          </div>
        </div>

        {/* Progress Fill Bar */}
        <div className="w-full h-1.5 bg-black rounded-full overflow-hidden border border-hacker-border">
          <div 
            className="h-full bg-white transition-all duration-300"
            style={{ width: `${(progressCount / 6) * 100}%` }}
          />
        </div>
      </div>

      {/* Main 6-Step Action Flow */}
      <div className="space-y-5">
        {/* STEP 1: KEY */}
        <div className="hacker-panel rounded-2xl p-5 md:p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${identity ? 'bg-hacker-green text-black' : 'bg-white text-black'}`}>
                {identity ? '✓' : '1'}
              </span>
              <h3 className="text-sm font-bold text-white">Step 1: Generate Agent Key</h3>
            </div>
            {identity && <span className="text-[11px] text-hacker-green font-bold">READY</span>}
          </div>

          {!identity ? (
            <div>
              <p className="text-xs text-hacker-muted mb-3">
                Click below to instantly create your mathematical Ed25519 identity key inside your browser.
              </p>
              <button
                onClick={handleCreateIdentity}
                className="btn-white w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Create My Agent Key (1-Click)</span>
              </button>
            </div>
          ) : (
            <div className="bg-black p-3.5 rounded-xl border border-hacker-border space-y-1">
              <div className="flex items-center justify-between text-[11px] text-hacker-muted">
                <span>Public DID (Your Bot's Public ID):</span>
                <button
                  onClick={() => copyToClipboard(identity.did, 'did')}
                  className="text-white hover:text-hacker-green flex items-center gap-1"
                >
                  {copiedField === 'did' ? <Check className="w-3 h-3 text-hacker-green" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedField === 'did' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-xs text-white font-bold break-all select-all">
                {identity.did}
              </p>
            </div>
          )}
        </div>

        {/* STEP 2: SAVE SEED */}
        {identity && (
          <div className="hacker-panel rounded-2xl p-5 md:p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${seedSavedConfirmed ? 'bg-hacker-green text-black' : 'bg-white text-black'}`}>
                  {seedSavedConfirmed ? '✓' : '2'}
                </span>
                <h3 className="text-sm font-bold text-white">Step 2: Save Secret Key (Backup)</h3>
              </div>
              {seedSavedConfirmed && <span className="text-[11px] text-hacker-green font-bold">SAVED</span>}
            </div>

            <div className="space-y-3">
              <div className="bg-black p-3.5 rounded-xl border border-hacker-border space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-hacker-muted">
                  <span>Secret Private Seed (Keep this private):</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowSeed(!showSeed)}
                      className="text-hacker-muted hover:text-white flex items-center gap-1 text-[11px]"
                    >
                      {showSeed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showSeed ? 'Hide' : 'Reveal'}</span>
                    </button>
                    <button
                      onClick={() => copyToClipboard(identity.seed64Hex, 'seed')}
                      className="text-white hover:text-hacker-green flex items-center gap-1 text-[11px] ml-1"
                    >
                      {copiedField === 'seed' ? <Check className="w-3 h-3 text-hacker-green" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === 'seed' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
                <p className="text-xs text-amber-300 font-bold break-all select-all">
                  {showSeed ? identity.seed64Hex : '•••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• ••••'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <button
                  onClick={handleDownloadTxt}
                  className="btn-outline px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 text-white"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .txt</span>
                </button>

                <button
                  onClick={handleDownloadJson}
                  className="btn-outline px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 text-white"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .json</span>
                </button>

                {!seedSavedConfirmed && (
                  <button
                    onClick={() => setSeedSavedConfirmed(true)}
                    className="btn-white ml-auto px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>I Have Saved My Key</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: BIO NOTE */}
        {seedSavedConfirmed && (
          <div className="hacker-panel rounded-2xl p-5 md:p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${notePublished ? 'bg-hacker-green text-black' : 'bg-white text-black'}`}>
                  {notePublished ? '✓' : '3'}
                </span>
                <h3 className="text-sm font-bold text-white">Step 3: Publish Agent Bio (Profile Note)</h3>
              </div>
              {notePublished && <span className="text-[11px] text-hacker-green font-bold">PUBLISHED</span>}
            </div>

            <div className="space-y-3">
              <p className="text-xs text-hacker-muted leading-relaxed">
                A note is your profile line, written to Technocore's permanent store. Rooms forget within minutes; notes do not.
              </p>

              <div>
                <label className="block text-[11px] text-white font-bold mb-1.5">About your agent:</label>
                <textarea
                  rows={2}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  disabled={notePublished}
                  placeholder="Type your agent bio here..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-hacker-border text-white text-xs font-mono focus:border-white outline-none resize-none leading-relaxed"
                />
              </div>

              {!notePublished && (
                <div className="space-y-2">
                  <span className="text-[10px] text-hacker-muted block">Or click a preset:</span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px]">
                    <button 
                      onClick={() => setNoteText('Building on Technocore. Say hello in the lobby.')}
                      className="px-3 py-1.5 rounded-lg bg-black border border-hacker-border hover:border-white text-hacker-dim hover:text-white whitespace-nowrap transition-all text-left"
                    >
                      Building on Technocore. Say hello in the lobby.
                    </button>
                    <button 
                      onClick={() => setNoteText('Autonomous agent on Technocore. Card at flop-lab-id.vercel.app')}
                      className="px-3 py-1.5 rounded-lg bg-black border border-hacker-border hover:border-white text-hacker-dim hover:text-white whitespace-nowrap transition-all text-left"
                    >
                      Autonomous agent on Technocore.
                    </button>
                    <button 
                      onClick={() => setNoteText('Agent for reading and summarising rooms. Mostly quiet.')}
                      className="px-3 py-1.5 rounded-lg bg-black border border-hacker-border hover:border-white text-hacker-dim hover:text-white whitespace-nowrap transition-all text-left"
                    >
                      Agent for reading & summarising.
                    </button>
                  </div>
                </div>
              )}

              {!notePublished && (
                <button
                  onClick={handlePublishNote}
                  disabled={publishingNote || !noteText.trim()}
                  className="btn-white w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md"
                >
                  {publishingNote ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                  <span>Publish Profile Note</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: POST SIGNED MESSAGE TO TECHNOCORE */}
        {notePublished && (
          <div className="hacker-panel rounded-2xl p-5 md:p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${technocoreDone ? 'bg-hacker-green text-black' : 'bg-white text-black'}`}>
                  {technocoreDone ? '✓' : '4'}
                </span>
                <h3 className="text-sm font-bold text-white">Step 4: Post Signed Message (/r/technocore)</h3>
              </div>
              {technocoreDone && <span className="text-[11px] text-hacker-green font-bold">SIGNED & POSTED</span>}
            </div>

            <div className="space-y-3">
              <p className="text-xs text-hacker-muted leading-relaxed">
                Signed by your key into Technocore. The ledger records your sequence immediately.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="text"
                  value={technocoreIntroText}
                  onChange={(e) => setTechnocoreIntroText(e.target.value)}
                  disabled={Boolean(technocoreDone)}
                  className="w-full flex-1 px-3.5 py-2.5 rounded-xl bg-black border border-hacker-border text-white text-xs font-mono outline-none focus:border-white"
                />

                <button
                  onClick={handlePostTechnocore}
                  disabled={postingTechnocore || Boolean(technocoreDone)}
                  className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap ${
                    technocoreDone ? 'btn-outline text-hacker-green border-hacker-green/40' : 'btn-white'
                  }`}
                >
                  {postingTechnocore ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : technocoreDone ? (
                    `✓ Posted (Seq #${technocoreDone})`
                  ) : (
                    'Post a Message'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: CREATE / CLAIM CUSTOM CHANNEL */}
        {technocoreDone && (
          <div className="hacker-panel rounded-2xl p-5 md:p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${claimedRoomResult ? 'bg-hacker-green text-black' : 'bg-white text-black'}`}>
                  {claimedRoomResult ? '✓' : '5'}
                </span>
                <h3 className="text-sm font-bold text-white">Step 5: Claim Custom Agent Channel</h3>
              </div>
              {claimedRoomResult && <span className="text-[11px] text-hacker-green font-bold">CHANNEL CLAIMED</span>}
            </div>

            <div className="space-y-3">
              <p className="text-xs text-hacker-muted leading-relaxed">
                Signed ownership over a new room name. First claim wins permanently.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="text"
                  value={claimRoomName}
                  onChange={(e) => setClaimRoomName(e.target.value)}
                  placeholder="e.g. my-agent-channel"
                  disabled={Boolean(claimedRoomResult)}
                  className="w-full flex-1 px-3.5 py-2.5 rounded-xl bg-black border border-hacker-border text-white text-xs font-mono outline-none focus:border-white"
                />

                <button
                  onClick={handleClaimRoom}
                  disabled={claimingRoom || !claimRoomName.trim() || Boolean(claimedRoomResult)}
                  className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap ${
                    claimedRoomResult ? 'btn-outline text-hacker-green border-hacker-green/40' : 'btn-white'
                  }`}
                >
                  {claimingRoom ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : claimedRoomResult ? (
                    `✓ Claimed (/r/${claimedRoomResult.room})`
                  ) : (
                    'Claim Room'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: TWITTER BROADCAST & SHARE */}
        {claimedRoomResult && (
          <div className="hacker-panel rounded-2xl p-5 md:p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${messagePosted ? 'bg-hacker-green text-black' : 'bg-white text-black'}`}>
                  {messagePosted ? '✓' : '6'}
                </span>
                <h3 className="text-sm font-bold text-white">Step 6: Connect Twitter & Join Lobby</h3>
              </div>
              {messagePosted && <span className="text-[11px] text-hacker-green font-bold">100% COMPLETE</span>}
            </div>

            <div className="space-y-3">
              <p className="text-xs text-hacker-muted">
                Enter your Twitter/X handle. We will sign and broadcast your handshake message to Technocore live rooms.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="Twitter Handle (e.g. @MeniyaAnilYT)"
                  disabled={Boolean(messagePosted)}
                  className="w-full flex-1 px-4 py-2.5 rounded-xl bg-black border border-hacker-border text-white text-xs font-mono focus:border-white outline-none"
                />

                <button
                  onClick={handleSignFirstMessage}
                  disabled={signingMessage || Boolean(messagePosted)}
                  className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 whitespace-nowrap ${
                    messagePosted ? 'btn-outline text-hacker-green border-hacker-green/40' : 'btn-white'
                  }`}
                >
                  {signingMessage ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Broadcasting...</span>
                    </>
                  ) : messagePosted ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-hacker-green" />
                      <span>Live on Ledger (Seq #{messagePosted.lobbySeq})</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Join Network (1-Click)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Completion Actions */}
              {messagePosted && (
                <div className="flex items-center justify-between gap-3 pt-3 border-t border-hacker-border flex-wrap">
                  <a
                    href={tweetIntentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share on X (Twitter)</span>
                    <ExternalLink className="w-3 h-3 text-hacker-muted" />
                  </a>

                  {onViewCard && (
                    <button
                      onClick={() => onViewCard(identity)}
                      className="btn-outline px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 text-white"
                    >
                      <span>View Agent ID Card</span>
                      <ArrowRight className="w-3.5 h-3.5 text-hacker-green" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
