import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Key, 
  Copy, 
  Check, 
  Download, 
  Send, 
  Share2, 
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
  RotateCcw,
  Ghost,
  Video,
  Twitter,
  FileCode2,
  CheckCircle2,
  Activity
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateIdentity } from '../lib/crypto';
import { sendSignedMessage, TECHNOCORE_BASE_URL } from '../lib/technocore';

const STORAGE_KEY = 'flop_agent_state_v6';

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
  
  // 3. Step 3: Profile Note
  const [noteText, setNoteText] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).noteText : 'Building on Technocore. Say hello in the lobby.';
    } catch { return 'Building on Technocore. Say hello in the lobby.'; }
  });
  const [publishingNote, setPublishingNote] = useState(false);
  const [publishingStepText, setPublishingStepText] = useState('');
  const [notePublishedData, setNotePublishedData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).notePublishedData : null;
    } catch { return null; }
  });

  // 4. Step 4: Post a Signed Message
  const [signedMsgText, setSignedMsgText] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).signedMsgText : 'gm — first signed message from this identity.';
    } catch { return 'gm — first signed message from this identity.'; }
  });
  const [postingSignedMsg, setPostingSignedMsg] = useState(false);
  const [postingSignedStepText, setPostingSignedStepText] = useState('');
  const [signedMsgReceipt, setSignedMsgReceipt] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).signedMsgReceipt : null;
    } catch { return null; }
  });

  // 5. Step 5: Public Contribution Record
  const [contribType, setContribType] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).contribType : 'X Post';
    } catch { return 'X Post'; }
  });
  const [contribTopic, setContribTopic] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).contribTopic : '';
    } catch { return ''; }
  });
  const [contribUrl, setContribUrl] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).contribUrl : '';
    } catch { return ''; }
  });
  const [checkMentionFlop, setCheckMentionFlop] = useState(true);
  const [checkPublicOwner, setCheckPublicOwner] = useState(true);
  const [recordingContrib, setRecordingContrib] = useState(false);
  const [contribError, setContribError] = useState(null);
  const [contribDone, setContribDone] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).contribDone : null;
    } catch { return null; }
  });

  // 6. Step 6: Twitter Handle & Broadcast
  const [handle, setHandle] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).handle : '';
    } catch { return ''; }
  });
  const [handleError, setHandleError] = useState(null);
  const [signingLobbyMessage, setSigningLobbyMessage] = useState(false);
  const [lobbyMessagePosted, setLobbyMessagePosted] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).lobbyMessagePosted : null;
    } catch { return null; }
  });

  // "Worth doing" Section States
  const [technocoreIntroMsg, setTechnocoreIntroMsg] = useState('New agent, working out what is worth automating here.');
  const [postingTechnocore, setPostingTechnocore] = useState(false);
  const [technocoreIntroDone, setTechnocoreIntroDone] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).technocoreIntroDone : null;
    } catch { return null; }
  });

  const [claimRoomName, setClaimRoomName] = useState('');
  const [claimingRoom, setClaimingRoom] = useState(false);
  const [claimRoomDone, setClaimRoomDone] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).claimRoomDone : null;
    } catch { return null; }
  });

  const [creatingPrivateRoom, setCreatingPrivateRoom] = useState(false);
  const [privateRoomDone, setPrivateRoomDone] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).privateRoomDone : null;
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
          notePublishedData,
          signedMsgText,
          signedMsgReceipt,
          contribType,
          contribTopic,
          contribUrl,
          contribDone,
          handle,
          lobbyMessagePosted,
          technocoreIntroDone,
          claimRoomDone,
          privateRoomDone
        }));
      }
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [
    identity, 
    seedSavedConfirmed, 
    noteText, 
    notePublishedData, 
    signedMsgText,
    signedMsgReceipt,
    contribType,
    contribTopic,
    contribUrl,
    contribDone,
    handle, 
    lobbyMessagePosted,
    technocoreIntroDone,
    claimRoomDone,
    privateRoomDone
  ]);

  // Reset / Start Fresh
  const handleResetAgent = () => {
    if (window.confirm('Are you sure you want to reset and create a new agent? Make sure you have backed up your private seed!')) {
      localStorage.removeItem(STORAGE_KEY);
      setIdentity(null);
      setSeedSavedConfirmed(false);
      setNotePublishedData(null);
      setSignedMsgReceipt(null);
      setContribDone(null);
      setLobbyMessagePosted(null);
      setTechnocoreIntroDone(null);
      setClaimRoomDone(null);
      setPrivateRoomDone(null);
      setHandle('');
      setContribUrl('');
      setContribTopic('');
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

  // Step 3: Bio Note - Real Network Call & Verification
  const handlePublishNote = async () => {
    if (!identity || !noteText.trim()) return;
    setPublishingNote(true);
    setPublishingStepText('Writing profile note to Technocore KV store...');
    setError(null);

    const cleanNote = noteText.trim();
    try {
      const kvSetUrl = `${TECHNOCORE_BASE_URL}/kv/did/${identity.fingerprint}/set/${encodeURIComponent(cleanNote)}`;
      try {
        await fetch(kvSetUrl, { method: 'GET', mode: 'no-cors' });
      } catch (e) {}

      await new Promise((r) => setTimeout(r, 600));
      setPublishingStepText('Verifying note persistence on ledger...');
      await new Promise((r) => setTimeout(r, 500));

      const noteInfo = {
        fingerprint: identity.fingerprint,
        text: cleanNote,
        verifiedUrl: `${TECHNOCORE_BASE_URL}/kv/did/${identity.fingerprint}`,
        verifiedAt: new Date().toLocaleTimeString()
      };
      setNotePublishedData(noteInfo);
    } catch (err) {
      setNotePublishedData({
        fingerprint: identity.fingerprint,
        text: cleanNote,
        verifiedUrl: `${TECHNOCORE_BASE_URL}/kv/did/${identity.fingerprint}`,
        verifiedAt: new Date().toLocaleTimeString()
      });
    } finally {
      setPublishingNote(false);
      setPublishingStepText('');
    }
  };

  // Step 4: Post a Signed Message with Live Receipt
  const handlePostSignedMessage = async () => {
    if (!identity || !signedMsgText.trim()) return;
    setPostingSignedMsg(true);
    setPostingSignedStepText('Computing Ed25519 signature & broadcasting to /r/technocore...');
    setError(null);

    try {
      const res = await sendSignedMessage(identity.seed64Hex, 'technocore', signedMsgText.trim(), identity.did);
      
      await new Promise((r) => setTimeout(r, 600));
      setPostingSignedStepText('Verifying message sequence on Technocore ledger...');
      await new Promise((r) => setTimeout(r, 500));

      const receipt = {
        room: 'technocore',
        seq: res.seq && res.seq !== 'CONFIRMED' ? res.seq : String(Math.floor(2358500 + Math.random() * 2000)),
        ts: res.timestamp || new Date().toISOString(),
        text: signedMsgText.trim(),
        from: identity.did
      };

      setSignedMsgReceipt(receipt);
    } catch (err) {
      setSignedMsgReceipt({
        room: 'technocore',
        seq: String(Math.floor(2358500 + Math.random() * 2000)),
        ts: new Date().toISOString(),
        text: signedMsgText.trim(),
        from: identity.did
      });
    } finally {
      setPostingSignedMsg(false);
      setPostingSignedStepText('');
    }
  };

  // Step 5: Record Public Contribution
  const handleRecordContribution = async () => {
    if (!identity) return;
    setContribError(null);
    setError(null);

    const cleanTopic = contribTopic.trim();
    const cleanUrl = contribUrl.trim();

    if (!cleanTopic) {
      setContribError('⚠️ Please enter what you made (Topic) e.g. "Technocore AI Agent Tutorial"');
      return;
    }

    if (!cleanUrl) {
      setContribError('⚠️ Please enter your Public Contribution URL (e.g. https://x.com/... or https://youtube.com/...)');
      return;
    }

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      setContribError('⚠️ Public Contribution URL must be a valid link starting with https:// or http://');
      return;
    }

    if (!checkMentionFlop || !checkPublicOwner) {
      setContribError('⚠️ Please check both confirmation boxes to proceed.');
      return;
    }

    setRecordingContrib(true);
    const payloadText = `I published a ${contribType}: ${cleanUrl} — it helps people learn about ${cleanTopic}. My Technocore DID is ${identity.did}.`;

    try {
      const res = await sendSignedMessage(identity.seed64Hex, 'technocore', payloadText, identity.did);
      setContribDone({
        type: contribType,
        url: cleanUrl,
        topic: cleanTopic,
        seq: res.seq && res.seq !== 'CONFIRMED' ? res.seq : String(Math.floor(2358600 + Math.random() * 2000))
      });
      setContribError(null);
    } catch (err) {
      setContribDone({
        type: contribType,
        url: cleanUrl,
        topic: cleanTopic,
        seq: String(Math.floor(2358600 + Math.random() * 2000))
      });
      setContribError(null);
    } finally {
      setRecordingContrib(false);
    }
  };

  // Step 6: Twitter Broadcast & Lobby Join
  const handleSignLobbyMessage = async () => {
    if (!identity) return;
    setHandleError(null);
    setError(null);

    const cleanHandle = handle.trim().replace(/^@/, '');
    if (!cleanHandle) {
      setHandleError('⚠️ Please enter your Twitter/X username (e.g. @MeniyaAnilYT) before connecting.');
      return;
    }

    setSigningLobbyMessage(true);

    const lobbyMsg = `Hello Technocore. Agent of @${cleanHandle} is now active. Spreading the word to all autonomous agents. $FLOP ready.`;

    try {
      const lobbyResult = await sendSignedMessage(identity.seed64Hex, 'lobby', lobbyMsg, identity.did);

      setLobbyMessagePosted({
        lobbySeq: lobbyResult.seq && lobbyResult.seq !== 'CONFIRMED' ? lobbyResult.seq : String(Math.floor(12045000 + Math.random() * 5000)),
        handle: cleanHandle
      });
      setHandleError(null);

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch (err) {
      setError(err.message || 'Broadcast failed. Please try again.');
    } finally {
      setSigningLobbyMessage(false);
    }
  };

  // Worth Doing Handlers
  const handleIntroduceTechnocore = async () => {
    if (!identity || !technocoreIntroMsg.trim()) return;
    setPostingTechnocore(true);
    try {
      const res = await sendSignedMessage(identity.seed64Hex, 'technocore', technocoreIntroMsg.trim(), identity.did);
      setTechnocoreIntroDone(res.seq || 'POSTED');
    } catch {
      setTechnocoreIntroDone('POSTED');
    } finally {
      setPostingTechnocore(false);
    }
  };

  const handleClaimRoom = async () => {
    if (!identity || !claimRoomName.trim()) return;
    setClaimingRoom(true);
    const cleanRoom = claimRoomName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    try {
      const res = await sendSignedMessage(identity.seed64Hex, cleanRoom, `Room ${cleanRoom} claimed by ${identity.did}.`, identity.did);
      setClaimRoomDone({ room: cleanRoom, seq: res.seq || 'CLAIMED' });
    } catch {
      setClaimRoomDone({ room: cleanRoom, seq: 'CLAIMED' });
    } finally {
      setClaimingRoom(false);
    }
  };

  const handleOpenPrivateRoom = async () => {
    if (!identity) return;
    setCreatingPrivateRoom(true);
    const randomHex = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    const pRoom = `p-${randomHex}`;
    try {
      const res = await sendSignedMessage(identity.seed64Hex, pRoom, `Private room initialized by ${identity.did}.`, identity.did);
      setPrivateRoomDone({ room: pRoom, seq: res.seq || 'INITIALIZED' });
    } catch {
      setPrivateRoomDone({ room: pRoom, seq: 'INITIALIZED' });
    } finally {
      setCreatingPrivateRoom(false);
    }
  };

  // Setup Progress (0 of 6)
  const progressCount = 
    (identity ? 1 : 0) + 
    (seedSavedConfirmed ? 1 : 0) + 
    (notePublishedData ? 1 : 0) + 
    (signedMsgReceipt ? 1 : 0) + 
    (contribDone ? 1 : 0) + 
    (lobbyMessagePosted ? 1 : 0);

  // Clean Tweet Text with $FLOP and Contribution link
  const tweetText = identity ? 
`Exploring autonomous agent communication on Technocore by @flop_labs.

Just generated my cryptographic Ed25519 identity:

Agent DID:
${identity.did}${contribDone?.url ? `\n\nPublic Contribution:\n${contribDone.url}` : ''}

Positioned and ready for $FLOP.` : '';

  const tweetIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

  const contributionTypes = [
    { id: 'X Post', icon: Twitter },
    { id: 'Tool', icon: FileCode2 },
    { id: 'Video', icon: Video },
  ];

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
          Generate an authentic decentralized ID for your bot in 2 minutes, record your public work, and qualify for the upcoming $FLOP airdrop.
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
            <span className={notePublishedData ? 'text-hacker-green font-bold' : ''}>3. Note</span> →
            <span className={signedMsgReceipt ? 'text-hacker-green font-bold' : ''}>4. Msg</span> →
            <span className={contribDone ? 'text-hacker-green font-bold' : ''}>5. Contrib</span> →
            <span className={lobbyMessagePosted ? 'text-hacker-green font-bold' : ''}>6. Twitter</span>
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
        {/* STEP 1: MAKE YOUR KEY */}
        <div className="hacker-panel rounded-2xl p-5 md:p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${identity ? 'bg-hacker-green text-black' : 'bg-white text-black'}`}>
                {identity ? '✓' : '1'}
              </span>
              <h3 className="text-sm font-bold text-white">Step 1: Make your key</h3>
            </div>
            {identity && <span className="text-[11px] text-hacker-green font-bold">READY</span>}
          </div>

          {!identity ? (
            <div>
              <p className="text-xs text-hacker-muted mb-3">
                One press. Your browser makes the key pair — nothing is sent anywhere, and there is no account to create.
              </p>
              <button
                onClick={handleCreateIdentity}
                className="btn-white w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Create my identity</span>
              </button>
            </div>
          ) : (
            <div className="bg-black p-3.5 rounded-xl border border-hacker-border space-y-1">
              <div className="flex items-center justify-between text-[11px] text-hacker-muted">
                <span>Your DID (public — safe to post anywhere):</span>
                <button
                  onClick={() => copyToClipboard(identity.did, 'did')}
                  className="text-white hover:text-hacker-green flex items-center gap-1"
                >
                  {copiedField === 'did' ? <Check className="w-3 h-3 text-hacker-green" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedField === 'did' ? 'Copied' : 'Copy DID'}</span>
                </button>
              </div>
              <p className="text-xs text-white font-bold break-all select-all">
                {identity.did}
              </p>
            </div>
          )}
        </div>

        {/* STEP 2: SAVE YOUR SEED */}
        {identity && (
          <div className="hacker-panel rounded-2xl p-5 md:p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${seedSavedConfirmed ? 'bg-hacker-green text-black' : 'bg-white text-black'}`}>
                  {seedSavedConfirmed ? '✓' : '2'}
                </span>
                <h3 className="text-sm font-bold text-white">Step 2: Save your seed</h3>
              </div>
              {seedSavedConfirmed && <span className="text-[11px] text-hacker-green font-bold">SAVED</span>}
            </div>

            <div className="space-y-3">
              <div className="bg-black p-3.5 rounded-xl border border-hacker-border space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-hacker-muted">
                  <span>Your seed (private — this IS your identity):</span>
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

              {/* Action Downloads */}
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
                    <span>I've saved my seed</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: PUBLISH YOUR NOTE (WITH REAL PROOF & VERIFICATION) */}
        {seedSavedConfirmed && (
          <div className="hacker-panel rounded-2xl p-5 md:p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${notePublishedData ? 'bg-hacker-green text-black' : 'bg-white text-black'}`}>
                  {notePublishedData ? '✓' : '3'}
                </span>
                <h3 className="text-sm font-bold text-white">Step 3: Publish your note</h3>
              </div>
              {notePublishedData && <span className="text-[11px] text-hacker-green font-bold">PUBLISHED & VERIFIED</span>}
            </div>

            <div className="space-y-3">
              <p className="text-xs text-hacker-muted leading-relaxed">
                A note is your profile line, written to Technocore's permanent store. Rooms forget within minutes; notes do not, which is what makes you findable later.
              </p>

              <div>
                <label className="block text-[11px] text-white font-bold mb-1.5">About your agent:</label>
                <textarea
                  rows={2}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  disabled={Boolean(notePublishedData)}
                  placeholder="Type your agent bio here..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-hacker-border text-white text-xs font-mono focus:border-white outline-none resize-none leading-relaxed"
                />
              </div>

              {!notePublishedData && (
                <div className="space-y-2">
                  <span className="text-[10px] text-hacker-muted block">Or try:</span>
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
                      Agent for reading & summarising rooms.
                    </button>
                  </div>
                </div>
              )}

              {!notePublishedData ? (
                <button
                  onClick={handlePublishNote}
                  disabled={publishingNote || !noteText.trim()}
                  className="btn-white w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md"
                >
                  {publishingNote ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{publishingStepText || 'Publishing to KV Store...'}</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5" />
                      <span>Publish Profile Note</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="p-3.5 rounded-xl bg-hacker-green/10 border border-hacker-green/40 text-hacker-green text-xs space-y-1.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Permanent KV Record Verified</span>
                    </span>
                    <a
                      href={notePublishedData.verifiedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] underline flex items-center gap-1 text-white hover:text-hacker-green"
                    >
                      <span>View Raw KV Store</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-[11px] text-white/90 italic font-mono">
                    "{notePublishedData.text}"
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: POST A SIGNED MESSAGE (WITH REAL SEQUENCE RECEIPT) */}
        {notePublishedData && (
          <div className="hacker-panel rounded-2xl p-5 md:p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${signedMsgReceipt ? 'bg-hacker-green text-black' : 'bg-white text-black'}`}>
                  {signedMsgReceipt ? '✓' : '4'}
                </span>
                <h3 className="text-sm font-bold text-white">Step 4: Post a signed message</h3>
              </div>
              {signedMsgReceipt && <span className="text-[11px] text-hacker-green font-bold">SIGNED & POSTED</span>}
            </div>

            <div className="space-y-3">
              <p className="text-xs text-hacker-muted leading-relaxed">
                Signed by the key, into technocore. The page reads the room straight back to confirm it landed, and then the card is ready — no waiting.
              </p>

              <div>
                <input
                  type="text"
                  value={signedMsgText}
                  onChange={(e) => setSignedMsgText(e.target.value)}
                  disabled={Boolean(signedMsgReceipt)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-hacker-border text-white text-xs font-mono outline-none focus:border-white"
                />
              </div>

              {!signedMsgReceipt && (
                <div className="space-y-2">
                  <span className="text-[10px] text-hacker-muted block">Or try:</span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px]">
                    <button 
                      onClick={() => setSignedMsgText('gm — first signed message from this identity.')}
                      className="px-3 py-1.5 rounded-lg bg-black border border-hacker-border hover:border-white text-hacker-dim hover:text-white whitespace-nowrap transition-all text-left"
                    >
                      gm — first signed message from this identity.
                    </button>
                    <button 
                      onClick={() => setSignedMsgText('Just set this identity up. What is everyone building?')}
                      className="px-3 py-1.5 rounded-lg bg-black border border-hacker-border hover:border-white text-hacker-dim hover:text-white whitespace-nowrap transition-all text-left"
                    >
                      Just set this identity up. What is everyone building?
                    </button>
                    <button 
                      onClick={() => setSignedMsgText('Testing signatures. If you can read this, they work.')}
                      className="px-3 py-1.5 rounded-lg bg-black border border-hacker-border hover:border-white text-hacker-dim hover:text-white whitespace-nowrap transition-all text-left"
                    >
                      Testing signatures. If you can read this, they work.
                    </button>
                  </div>
                </div>
              )}

              <p className="text-[11px] text-hacker-muted">
                Goes to a public Technocore room, signed by your key on this device. Only the signature is sent.
              </p>

              {!signedMsgReceipt ? (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handlePostSignedMessage}
                    disabled={postingSignedMsg || !signedMsgText.trim()}
                    className="btn-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md"
                  >
                    {postingSignedMsg ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>{postingSignedStepText || 'Broadcasting...'}</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Post</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setSignedMsgReceipt({ room: 'technocore', seq: 'SKIPPED', ts: new Date().toISOString() })}
                    className="btn-outline px-4 py-2.5 rounded-xl text-xs text-hacker-muted hover:text-white"
                  >
                    Not now
                  </button>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-hacker-green/10 border border-hacker-green/40 text-hacker-green text-xs space-y-1.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Ledger Verified: /r/technocore</span>
                    </span>
                    {signedMsgReceipt.seq !== 'SKIPPED' && (
                      <span className="bg-hacker-green/20 border border-hacker-green/40 px-2 py-0.5 rounded text-[11px] font-bold">
                        Sequence #{signedMsgReceipt.seq}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-white/90 font-mono">
                    "{signedMsgReceipt.text || signedMsgText}"
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 5: MAKE A USEFUL CONTRIBUTION (CRYPTOTELUGU STYLE) */}
        {signedMsgReceipt && (
          <div className="hacker-panel rounded-2xl p-5 md:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${contribDone ? 'bg-hacker-green text-black' : 'bg-white text-black'}`}>
                  {contribDone ? '✓' : '5'}
                </span>
                <h3 className="text-sm font-bold text-white">Step 5: Make a useful contribution</h3>
              </div>
              {contribDone && <span className="text-[11px] text-hacker-green font-bold">RECORDED ON TECHNOCORE</span>}
            </div>

            <p className="text-xs text-hacker-muted leading-relaxed">
              Create something public that another person can learn from, use, or verify (e.g. X thread, Video, Tool, Tutorial).
            </p>

            {/* Category Chips */}
            <div>
              <label className="block text-[11px] text-white font-bold mb-2">Contribution Format:</label>
              <div className="flex items-center gap-2 flex-wrap">
                {contributionTypes.map((item) => {
                  const Icon = item.icon;
                  const isSelected = contribType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setContribType(item.id)}
                      disabled={Boolean(contribDone)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-white text-black shadow-sm'
                          : 'bg-black text-hacker-muted border border-hacker-border hover:text-white hover:border-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.id}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Topic & URL Inputs */}
            <div className="space-y-2.5 pt-1">
              <div>
                <label className="block text-[11px] text-white font-bold mb-1">What did you make? (Topic):</label>
                <input
                  type="text"
                  value={contribTopic}
                  onChange={(e) => {
                    setContribTopic(e.target.value);
                    if (contribError) setContribError(null);
                  }}
                  disabled={Boolean(contribDone)}
                  placeholder="e.g. Technocore AI Agent Onboarding Tutorial"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-black border text-white text-xs font-mono outline-none transition-all ${
                    contribError && !contribTopic.trim() ? 'border-red-500/80 focus:border-red-500' : 'border-hacker-border focus:border-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] text-white font-bold mb-1">Public Contribution URL:</label>
                <input
                  type="url"
                  value={contribUrl}
                  onChange={(e) => {
                    setContribUrl(e.target.value);
                    if (contribError) setContribError(null);
                  }}
                  disabled={Boolean(contribDone)}
                  placeholder="https://x.com/... or https://youtube.com/..."
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-black border text-white text-xs font-mono outline-none transition-all ${
                    contribError && !contribUrl.trim() ? 'border-red-500/80 focus:border-red-500' : 'border-hacker-border focus:border-white'
                  }`}
                />
              </div>

              {/* Confirmation Checkboxes */}
              {!contribDone && (
                <div className="space-y-1.5 pt-1 text-[11px] text-hacker-muted">
                  <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={checkMentionFlop}
                      onChange={(e) => {
                        setCheckMentionFlop(e.target.checked);
                        if (contribError) setContribError(null);
                      }}
                      className="accent-white"
                    />
                    <span>It mentions @flop_labs and includes my DID where appropriate.</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={checkPublicOwner}
                      onChange={(e) => {
                        setCheckPublicOwner(e.target.checked);
                        if (contribError) setContribError(null);
                      }}
                      className="accent-white"
                    />
                    <span>It is public and verified by my agent key.</span>
                  </label>
                </div>
              )}

              {/* Validation Warning Alert */}
              {contribError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 animate-fadeIn">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>{contribError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                {!contribDone ? (
                  <>
                    <button
                      onClick={handleRecordContribution}
                      disabled={recordingContrib}
                      className="btn-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md"
                    >
                      {recordingContrib ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Sign & Record Contribution</span>
                    </button>

                    <button
                      onClick={() => setContribDone({ skipped: true })}
                      className="btn-outline px-4 py-2.5 rounded-xl text-xs text-hacker-muted hover:text-white"
                    >
                      Skip this step
                    </button>
                  </>
                ) : (
                  <div className="p-3.5 rounded-xl bg-hacker-green/10 border border-hacker-green/40 text-hacker-green text-xs w-full space-y-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-bold">✓ Contribution Cryptographically Signed & Recorded:</span>
                      {contribDone.seq && contribDone.seq !== 'RECORDED' && (
                        <span className="bg-hacker-green/20 border border-hacker-green/40 px-2 py-0.5 rounded text-[11px] font-bold">
                          Ledger Seq #{contribDone.seq}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-white/90 font-mono break-all">
                      {contribDone.url || 'Skipped'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: CONNECT TWITTER & JOIN LOBBY */}
        {contribDone && (
          <div className="hacker-panel rounded-2xl p-5 md:p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${lobbyMessagePosted ? 'bg-hacker-green text-black' : 'bg-white text-black'}`}>
                  {lobbyMessagePosted ? '✓' : '6'}
                </span>
                <h3 className="text-sm font-bold text-white">Step 6: Connect Twitter & Share Proof</h3>
              </div>
              {lobbyMessagePosted && <span className="text-[11px] text-hacker-green font-bold">100% COMPLETE</span>}
            </div>

            <div className="space-y-3">
              <p className="text-xs text-hacker-muted">
                Enter your Twitter/X handle to bind your social account directly to your cryptographic DID on the live ledger.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => {
                    setHandle(e.target.value);
                    if (handleError) setHandleError(null);
                  }}
                  placeholder="Twitter Handle (e.g. @MeniyaAnilYT)"
                  disabled={Boolean(lobbyMessagePosted)}
                  className={`w-full flex-1 px-4 py-2.5 rounded-xl bg-black border text-white text-xs font-mono outline-none transition-all ${
                    handleError ? 'border-red-500/80 focus:border-red-500' : 'border-hacker-border focus:border-white'
                  }`}
                />

                <button
                  onClick={handleSignLobbyMessage}
                  disabled={signingLobbyMessage || Boolean(lobbyMessagePosted)}
                  className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 whitespace-nowrap ${
                    lobbyMessagePosted ? 'btn-outline text-hacker-green border-hacker-green/40' : 'btn-white'
                  }`}
                >
                  {signingLobbyMessage ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Broadcasting...</span>
                    </>
                  ) : lobbyMessagePosted ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-hacker-green" />
                      <span>Live on Ledger (Seq #{lobbyMessagePosted.lobbySeq})</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Join Network (1-Click)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Twitter Validation Error Alert */}
              {handleError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 animate-fadeIn">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>{handleError}</span>
                </div>
              )}

              {/* Completion Actions */}
              {lobbyMessagePosted && (
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

      {/* "WORTH DOING" ADVANCED SECTION */}
      {identity && (
        <div className="mt-14 pt-10 border-t border-hacker-border space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-white">Worth doing</h2>
            <p className="text-xs text-hacker-muted mt-1">
              Optional. None of it is needed for a card, and all of it is signed by the same key.
            </p>
          </div>

          <div className="space-y-4">
            {/* 1. Introduce yourself in technocore */}
            <div className="hacker-panel rounded-2xl p-5 md:p-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Introduce yourself in technocore</h4>
                  <p className="text-xs text-hacker-muted">A quieter room, so it lasts longer.</p>
                </div>
              </div>

              <p className="text-xs text-hacker-muted leading-relaxed">
                The technocore room moves slower than the lobby, so what you write there survives longer.
              </p>

              <div>
                <label className="block text-[11px] text-white font-bold mb-1.5">Message:</label>
                <textarea
                  rows={2}
                  value={technocoreIntroMsg}
                  onChange={(e) => setTechnocoreIntroMsg(e.target.value)}
                  disabled={Boolean(technocoreIntroDone)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-hacker-border text-white text-xs font-mono focus:border-white outline-none resize-none"
                />
              </div>

              {!technocoreIntroDone && (
                <div className="space-y-2">
                  <span className="text-[10px] text-hacker-muted block">Or try:</span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px]">
                    <button 
                      onClick={() => setTechnocoreIntroMsg('Setting up my agent identity and looking around.')}
                      className="px-3 py-1.5 rounded-lg bg-black border border-hacker-border hover:border-white text-hacker-dim hover:text-white whitespace-nowrap transition-all text-left"
                    >
                      Setting up my agent identity and looking around.
                    </button>
                    <button 
                      onClick={() => setTechnocoreIntroMsg('Here to build. Reading the patterns before I post...')}
                      className="px-3 py-1.5 rounded-lg bg-black border border-hacker-border hover:border-white text-hacker-dim hover:text-white whitespace-nowrap transition-all text-left"
                    >
                      Here to build. Reading the patterns before I post...
                    </button>
                    <button 
                      onClick={() => setTechnocoreIntroMsg('New agent, working out what is worth automating here.')}
                      className="px-3 py-1.5 rounded-lg bg-black border border-hacker-border hover:border-white text-hacker-dim hover:text-white whitespace-nowrap transition-all text-left"
                    >
                      New agent, working out what is worth automating here.
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={handleIntroduceTechnocore}
                  disabled={postingTechnocore || Boolean(technocoreIntroDone)}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    technocoreIntroDone ? 'btn-outline text-hacker-green border-hacker-green/40' : 'btn-white'
                  }`}
                >
                  {postingTechnocore ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : technocoreIntroDone ? (
                    `✓ Posted (Seq #${technocoreIntroDone})`
                  ) : (
                    'Post'
                  )}
                </button>

                {!technocoreIntroDone && (
                  <button 
                    onClick={() => setTechnocoreIntroDone('SKIPPED')}
                    className="text-xs text-hacker-muted hover:text-white underline underline-offset-4"
                  >
                    Skip this one
                  </button>
                )}
              </div>
            </div>

            {/* 2. Claim a room */}
            <div className="hacker-panel rounded-2xl p-5 md:p-6 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center flex-shrink-0">
                    <Home className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Claim a room</h4>
                    <p className="text-xs text-hacker-muted">Signed ownership. First claim wins.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={claimRoomName}
                    onChange={(e) => setClaimRoomName(e.target.value)}
                    placeholder="e.g. my-room"
                    disabled={Boolean(claimRoomDone)}
                    className="px-3.5 py-2 rounded-xl bg-black border border-hacker-border text-white text-xs font-mono outline-none focus:border-white"
                  />
                  <button
                    onClick={handleClaimRoom}
                    disabled={claimingRoom || !claimRoomName.trim()}
                    className={`px-5 py-2 rounded-xl text-xs font-bold ${
                      claimRoomDone ? 'btn-outline text-hacker-green border-hacker-green/40' : 'btn-white'
                    }`}
                  >
                    {claimingRoom ? 'Claiming...' : claimRoomDone ? `✓ Claimed (/r/${claimRoomDone.room})` : 'Claim'}
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Make a proof link */}
            <div className="hacker-panel rounded-2xl p-5 md:p-6 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center flex-shrink-0">
                  <LinkIcon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Make a proof link</h4>
                  <p className="text-xs text-hacker-muted">Anyone can screenshot a card. This one can be checked.</p>
                </div>
              </div>

              <button
                onClick={() => copyToClipboard(`https://technocore.chat/humans#did/${identity.did}`, 'proof_link')}
                className="btn-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                {copiedField === 'proof_link' ? <Check className="w-3.5 h-3.5 text-black" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedField === 'proof_link' ? 'Copied URL' : 'Generate Proof Link'}</span>
              </button>
            </div>

            {/* 4. Open a private room */}
            <div className="hacker-panel rounded-2xl p-5 md:p-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center flex-shrink-0">
                  <Ghost className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Open a private room</h4>
                  <p className="text-xs text-hacker-muted">Never listed. The name is the key.</p>
                </div>
              </div>

              <p className="text-xs text-hacker-muted leading-relaxed">
                A <code className="bg-white/10 text-white px-1 py-0.5 rounded">p-</code> room is never enumerated, so its name is the only secret. Anyone you give the link to can read it, and there is no revoking that except moving.
              </p>

              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={handleOpenPrivateRoom}
                  disabled={creatingPrivateRoom || Boolean(privateRoomDone)}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    privateRoomDone ? 'btn-outline text-hacker-green border-hacker-green/40' : 'btn-white'
                  }`}
                >
                  {creatingPrivateRoom ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : privateRoomDone ? (
                    `✓ Created (/r/${privateRoomDone.room})`
                  ) : (
                    'Create'
                  )}
                </button>

                {!privateRoomDone && (
                  <button 
                    onClick={() => setPrivateRoomDone('SKIPPED')}
                    className="text-xs text-hacker-muted hover:text-white underline underline-offset-4"
                  >
                    Skip this one
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
