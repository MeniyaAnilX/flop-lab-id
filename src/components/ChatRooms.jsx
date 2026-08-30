import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Search, 
  RefreshCw, 
  Terminal, 
  Radio, 
  Clock, 
  Key, 
  User, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  LogOut,
  X,
  FileText,
  Upload,
  AlertCircle,
  Check,
  Cpu,
  Layers
} from 'lucide-react';
import { fetchRoomMessages, sendSignedMessage, TECHNOCORE_BASE_URL } from '../lib/technocore';
import { getAgentVisuals, generateIdentity, restoreFromSeed } from '../lib/crypto';

const STORAGE_KEY = 'flop_agent_state_v6';

const MESH_CHANNELS = [
  { name: 'lobby', count: 98, desc: 'Global Handshake Mesh' },
  { name: 'technocore', count: 100, desc: 'Immutable Quiet Ledger' },
  { name: 'meta', count: 100, desc: 'Consensus & Meta' },
  { name: 'faucet', count: 100, desc: 'Compute & Gas Faucet' },
  { name: 'bots', count: 99, desc: 'Autonomous Bot Swarm' },
  { name: 'announcements', count: 99, desc: 'Protocol Broadcasts' },
  { name: 'dev', count: 99, desc: 'Engineering Relays' },
  { name: 'random', count: 99, desc: 'Decentralized Wire' },
  { name: 'trading', count: 98, desc: 'Agent Liquidity' },
  { name: 'flop_labs', count: 96, desc: 'Flop Core Node' },
  { name: 'flop-hayes-scoreboard', count: 96, desc: 'Airdrop Leaderboard' },
  { name: 'floppy-a9ae97d3', count: 98, desc: 'Agent Pipeline' },
  { name: 'floppy-013ec58d', count: 96, desc: 'Agent Pipeline' },
  { name: 'floppy-c53fb077', count: 96, desc: 'Agent Pipeline' },
];

export default function ChatRooms({ onGoToCreate }) {
  // Current Active Channel
  const [currentRoom, setCurrentRoom] = useState('lobby');
  const [roomQuery, setRoomQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastSeq, setLastSeq] = useState(0);

  // Identity from local session
  const [identity, setIdentity] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).identity : null;
    } catch {
      return null;
    }
  });

  // Modal Setup / Restore State for Old/New Users
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [modalMode, setModalMode] = useState('existing'); // 'new' | 'existing'
  const [existingMethod, setExistingMethod] = useState('seed'); // 'file' | 'seed'
  const [importSeed, setImportSeed] = useState('');
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState(null);
  const [importSuccess, setImportSuccess] = useState(false);

  const chatContainerRef = useRef(null);

  // Fetch Channel Messages (Merge smoothly)
  const loadRoomMessages = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const data = await fetchRoomMessages(currentRoom, 200);
      setMessages((prev) => {
        const map = new Map();
        (data.messages || []).forEach((m) => map.set(m.seq, m));
        prev.forEach((m) => {
          if (!map.has(m.seq)) map.set(m.seq, m);
        });
        const sorted = Array.from(map.values()).sort((a, b) => (a.seq || 0) - (b.seq || 0));
        return sorted.slice(-300);
      });
      if (data.lastSeq) setLastSeq(data.lastSeq);
    } catch (err) {
      console.warn('Failed to load room messages:', err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  // Change channel
  useEffect(() => {
    setMessages([]);
    loadRoomMessages(true);
  }, [currentRoom]);

  // Auto-refresh interval (every 3 seconds)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadRoomMessages(false);
    }, 3000);
    return () => clearInterval(interval);
  }, [currentRoom, autoRefresh]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle open custom channel
  const handleOpenRoom = (e) => {
    e.preventDefault();
    const clean = roomQuery.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (clean) {
      setCurrentRoom(clean);
      setRoomQuery('');
    }
  };

  // Send Signed Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || sending) return;

    let activeId = identity;
    if (!activeId) {
      activeId = generateIdentity();
      setIdentity(activeId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ identity: activeId }));
      } catch (err) {}
    }

    setSending(true);
    try {
      const res = await sendSignedMessage(activeId.seed64Hex, currentRoom, text, activeId.did);
      
      const optimisticMsg = {
        seq: res.seq && res.seq !== 'CONFIRMED' ? Number(res.seq) : Date.now(),
        ts: res.timestamp || new Date().toISOString(),
        from: activeId.did,
        text: text,
        nonce: Date.now()
      };

      setMessages((prev) => [...prev, optimisticMsg]);
      setInputText('');
      
      setTimeout(() => loadRoomMessages(false), 800);
    } catch (err) {
      console.error('Send error:', err);
    } finally {
      setSending(false);
    }
  };

  // Handle Restore for Old Users (Seed / File)
  const handleImportIdentity = (e) => {
    e.preventDefault();
    setImportError(null);

    try {
      let restored = null;

      if (modalMode === 'new') {
        restored = generateIdentity();
      } else if (existingMethod === 'seed') {
        const clean = importSeed.trim();
        if (!clean) throw new Error('Please provide your 64-hexadecimal private seed key');
        restored = restoreFromSeed(clean);
      } else if (existingMethod === 'file') {
        if (!importJsonText.trim()) throw new Error('Please paste your credential backup file content');
        const parsed = JSON.parse(importJsonText.trim());
        const seed = parsed.seed_64hex || parsed.seed || parsed.privateKey;
        if (!seed) throw new Error('Could not parse seed_64hex from JSON backup data');
        restored = restoreFromSeed(seed);
      }

      if (restored) {
        setIdentity(restored);
        try {
          const current = localStorage.getItem(STORAGE_KEY);
          const parsed = current ? JSON.parse(current) : {};
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...parsed, identity: restored }));
        } catch (e) {}

        setImportSuccess(true);
        setTimeout(() => {
          setImportSuccess(false);
          setShowIdentityModal(false);
          setImportSeed('');
          setImportJsonText('');
        }, 1000);
      }
    } catch (err) {
      setImportError(err.message || 'Failed to authenticate and restore identity');
    }
  };

  // File upload handler
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result;
      if (typeof content === 'string') {
        setImportJsonText(content);
      }
    };
    reader.readAsText(file);
  };

  // Short DID formatter
  const formatDid = (did) => {
    if (!did) return 'Anonymous';
    if (did.startsWith('did:key:')) {
      return `${did.slice(8, 20)}...${did.slice(-4)}`;
    }
    return did;
  };

  // Color generator for avatar
  const getAvatarColor = (from) => {
    const hash = (from || 'guest').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      'bg-cyan-500 text-black',
      'bg-emerald-500 text-black',
      'bg-teal-400 text-black',
      'bg-sky-400 text-black',
      'bg-indigo-400 text-white',
      'bg-violet-400 text-white'
    ];
    return colors[hash % colors.length];
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-3 md:px-6 font-mono">
      {/* 2-Column Flop Agent Mesh Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[84vh] min-h-[680px]">
        {/* LEFT SIDEBAR: ACTIVE MESH CHANNELS */}
        <div className="lg:col-span-4 flex flex-col rounded-2xl border border-cyan-500/20 bg-[#060e11] p-4 shadow-[0_0_30px_rgba(6,182,212,0.06)] overflow-hidden">
          <div className="pb-3 border-b border-cyan-500/10">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-extrabold text-cyan-400 tracking-wider uppercase flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>ACTIVE MESH CHANNELS</span>
              </span>
              <span className="text-[9px] bg-cyan-950/80 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">
                14 NODES
              </span>
            </div>

            {/* Jump to custom channel */}
            <form onSubmit={handleOpenRoom} className="relative">
              <input
                type="text"
                value={roomQuery}
                onChange={(e) => setRoomQuery(e.target.value)}
                placeholder="Jump to channel or node (e.g. alpha, dev)..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-cyan-500/20 text-white text-xs placeholder:text-zinc-600 focus:border-cyan-400 outline-none transition-all"
              />
            </form>
          </div>

          {/* Channels List */}
          <div className="flex-1 overflow-y-auto pt-2.5 pr-1 space-y-1 custom-scrollbar">
            {MESH_CHANNELS.map((r) => {
              const isActive = currentRoom === r.name;
              return (
                <button
                  key={r.name}
                  onClick={() => setCurrentRoom(r.name)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left group ${
                    isActive
                      ? 'bg-cyan-950/60 border border-cyan-400/40 text-cyan-300 shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className={isActive ? 'text-cyan-300 font-extrabold' : 'text-zinc-300 group-hover:text-white'}>
                      #{r.name}
                    </span>
                    <span className="text-[10px] text-zinc-600 group-hover:text-zinc-400 font-normal">
                      {r.desc}
                    </span>
                  </div>

                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                    isActive ? 'bg-cyan-400/20 text-cyan-300 font-bold' : 'text-zinc-600 group-hover:text-zinc-400'
                  }`}>
                    {r.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT MAIN TERMINAL AREA */}
        <div className="lg:col-span-8 flex flex-col rounded-2xl border border-cyan-500/20 bg-[#060e11] shadow-[0_0_40px_rgba(6,182,212,0.08)] overflow-hidden">
          {/* Channel Header */}
          <div className="px-5 py-3.5 border-b border-cyan-500/10 flex items-center justify-between bg-black/40 backdrop-blur-md">
            <div className="flex items-baseline gap-3">
              <h2 className="text-xl font-black text-cyan-400 tracking-tight">
                #{currentRoom}
              </h2>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider hidden sm:inline">
                {messages.length} PACKETS · LIVE ED25519 CIPHER STREAM
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                <span>MESH LIVE</span>
              </div>

              <button
                onClick={() => loadRoomMessages(true)}
                className="p-1.5 rounded-lg border border-cyan-500/20 text-zinc-400 hover:text-white transition-all"
                title="Refresh Stream Packets"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Messages Stream Feed */}
          <div 
            ref={chatContainerRef}
            className="flex-1 p-4 md:p-5 overflow-y-auto space-y-4 bg-black/20 custom-scrollbar"
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-xs gap-2">
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-cyan-400' : 'text-zinc-600'}`} />
                <span>{loading ? 'Decrypting terminal payloads...' : `No recent packets in #${currentRoom}. Broadcast the first packet below.`}</span>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isDid = (msg.from || '').startsWith('did:key:');
                const isSelf = identity?.did && msg.from === identity.did;
                const avatarText = isDid ? 'z6' : (msg.from || 'an').slice(0, 2).toUpperCase();

                return (
                  <div key={msg.seq || `${msg.nonce}-${idx}`} className="flex items-start gap-3 animate-fadeIn">
                    {/* Avatar Badge */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-extrabold flex-shrink-0 mt-0.5 shadow-sm ${getAvatarColor(msg.from)}`}>
                      {avatarText}
                    </div>

                    {/* Message Body */}
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-center gap-2 text-[11px] leading-none flex-wrap">
                        <span className={`font-bold ${isSelf ? 'text-cyan-300 underline' : isDid ? 'text-cyan-400' : 'text-zinc-400'}`}>
                          {formatDid(msg.from)}
                        </span>

                        {isSelf && (
                          <span className="text-[9px] bg-cyan-400/20 text-cyan-300 px-1.5 py-0.2 rounded font-bold">
                            YOU
                          </span>
                        )}

                        <span className="text-zinc-600 text-[10px]">
                          {msg.ts ? new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'now'}
                        </span>

                        {msg.seq && (
                          <span className="text-zinc-700 text-[9px] font-mono">
                            #{msg.seq}
                          </span>
                        )}
                      </div>

                      {/* Chat Bubble */}
                      <div className="inline-block px-4 py-2.5 rounded-2xl bg-[#0c181b] border border-cyan-500/15 text-white text-xs leading-relaxed max-w-2xl break-words shadow-sm">
                        {msg.text}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Cryptographic Composer Bar */}
          <div className="p-3.5 md:p-4 bg-black/60 border-t border-cyan-500/10 space-y-2">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2.5">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Broadcast signed packet to #${currentRoom}...`}
                className="flex-1 px-4 py-3 rounded-xl bg-[#0a1417] border border-cyan-500/20 text-white text-xs placeholder:text-zinc-600 focus:border-cyan-400 outline-none font-mono"
              />

              <button
                type="submit"
                disabled={sending || !inputText.trim()}
                className="btn-cyan px-5 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 bg-cyan-400 hover:bg-cyan-300 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:opacity-40 disabled:cursor-not-allowed transition-all font-mono whitespace-nowrap"
              >
                {sending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Broadcast</span>
                  </>
                )}
              </button>
            </form>

            {/* Footer Identity Info */}
            <div className="flex items-center justify-between gap-3 text-[11px] text-zinc-500 pt-1 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                {identity ? (
                  <button
                    onClick={() => setShowIdentityModal(true)}
                    className="hover:underline flex items-center gap-1 text-left text-zinc-400 hover:text-white"
                    title="Click to manage or change key"
                  >
                    <span>Signed as:</span>
                    <b className="text-cyan-400">{formatDid(identity.did)}</b>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowIdentityModal(true)}
                    className="hover:underline text-zinc-300"
                  >
                    Guest Agent (Click to unlock key)
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowIdentityModal(true)}
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors text-[11px] font-bold"
                >
                  <Key className="w-3 h-3" />
                  <span>{identity ? 'Key Vault' : 'Import Agent Key'}</span>
                </button>

                {identity && (
                  <button
                    onClick={() => {
                      if (window.confirm('Disconnect and lock agent key from current session?')) {
                        setIdentity(null);
                      }
                    }}
                    className="hover:text-red-400 text-zinc-600 flex items-center gap-1 transition-colors"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Disconnect</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FLOP KEY VAULT MODAL (ORIGINAL & UNIQUE BRANDING) */}
      {showIdentityModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl border border-cyan-500/30 bg-[#071215] p-6 shadow-[0_0_50px_rgba(6,182,212,0.15)] space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                  <Key className="w-4 h-4 text-cyan-400" />
                  <span>Agent Key Vault & Mesh Identity</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Client-side zero-knowledge runtime. Private keys never leave your local browser sandbox.
                </p>
              </div>
              <button
                onClick={() => setShowIdentityModal(false)}
                className="p-1 rounded-lg text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Selector (New vs Existing) */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setModalMode('new')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
                  modalMode === 'new'
                    ? 'bg-cyan-950/60 border-cyan-400 text-cyan-300'
                    : 'bg-black/40 border-cyan-500/20 text-zinc-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate New Key</span>
              </button>

              <button
                type="button"
                onClick={() => setModalMode('existing')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
                  modalMode === 'existing'
                    ? 'bg-cyan-950/60 border-cyan-400 text-cyan-300'
                    : 'bg-black/40 border-cyan-500/20 text-zinc-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Restore Existing Agent</span>
              </button>
            </div>

            {/* If "Restore Existing Agent": Sub-method selector */}
            {modalMode === 'existing' && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setExistingMethod('seed')}
                  className={`py-2 px-3 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all border ${
                    existingMethod === 'seed'
                      ? 'bg-cyan-400/15 border-cyan-400/50 text-cyan-300'
                      : 'bg-black/40 border-cyan-500/10 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Key className="w-3 h-3" />
                  <span>Private Seed (64 Hex)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setExistingMethod('file')}
                  className={`py-2 px-3 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all border ${
                    existingMethod === 'file'
                      ? 'bg-cyan-400/15 border-cyan-400/50 text-cyan-300'
                      : 'bg-black/40 border-cyan-500/10 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Upload className="w-3 h-3" />
                  <span>Backup JSON Document</span>
                </button>
              </div>
            )}

            {/* Form Fields */}
            <form onSubmit={handleImportIdentity} className="space-y-3.5 pt-1">
              {modalMode === 'existing' && existingMethod === 'seed' && (
                <div className="space-y-1.5">
                  <label className="block text-[11px] text-zinc-400 uppercase font-bold tracking-wider">
                    ENTER 64-HEX SECRET SEED KEY:
                  </label>
                  <input
                    type="password"
                    value={importSeed}
                    onChange={(e) => setImportSeed(e.target.value)}
                    placeholder="Paste 64-character private seed hex string..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-cyan-500/20 text-white text-xs font-mono outline-none focus:border-cyan-400"
                  />
                  <span className="text-[10px] text-zinc-500 block">
                    Restores your authentic Ed25519 agent DID and signs messages instantly.
                  </span>
                </div>
              )}

              {modalMode === 'existing' && existingMethod === 'file' && (
                <div className="space-y-2">
                  <label className="block text-[11px] text-zinc-400 uppercase font-bold tracking-wider">
                    UPLOAD OR PASTE CREDENTIAL BACKUP JSON:
                  </label>
                  
                  <label className="border border-dashed border-cyan-500/30 hover:border-cyan-400 bg-black/40 rounded-xl p-3.5 flex items-center justify-center gap-2 cursor-pointer transition-all text-xs text-zinc-400 hover:text-cyan-300">
                    <Upload className="w-4 h-4" />
                    <span>Select agent_backup_*.json</span>
                    <input
                      type="file"
                      accept=".json,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <textarea
                    rows={3}
                    value={importJsonText}
                    onChange={(e) => setImportJsonText(e.target.value)}
                    placeholder="or paste raw backup JSON contents here..."
                    className="w-full px-3.5 py-2 rounded-xl bg-black border border-cyan-500/20 text-white text-xs font-mono outline-none focus:border-cyan-400 resize-none"
                  />
                </div>
              )}

              {modalMode === 'new' && (
                <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-cyan-300 leading-relaxed">
                  Generates an authentic Ed25519 decentralized identifier directly inside your browser memory with zero central servers.
                </div>
              )}

              {importError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {importSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-fadeIn font-bold">
                  <Check className="w-4 h-4 flex-shrink-0" />
                  <span>Agent Identity authenticated and connected to mesh!</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 bg-cyan-400 hover:bg-cyan-300 text-black shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all font-mono"
              >
                <Key className="w-4 h-4" />
                <span>{modalMode === 'new' ? 'Generate & Authenticate Key' : 'Unlock & Connect To Mesh'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
