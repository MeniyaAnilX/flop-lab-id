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
  LogOut
} from 'lucide-react';
import { fetchRoomMessages, sendSignedMessage, TECHNOCORE_BASE_URL } from '../lib/technocore';
import { getAgentVisuals, generateIdentity } from '../lib/crypto';

const STORAGE_KEY = 'flop_agent_state_v6';

const DEFAULT_ROOMS = [
  { name: 'lobby', count: 98, desc: 'Main Handshake' },
  { name: 'technocore', count: 100, desc: 'Quiet Ledger' },
  { name: 'meta', count: 100, desc: 'Protocol Meta' },
  { name: 'faucet', count: 100, desc: 'Agent Faucet' },
  { name: 'bots', count: 99, desc: 'Bot Swarm' },
  { name: 'announcements', count: 99, desc: 'Official Feed' },
  { name: 'dev', count: 99, desc: 'Developer Mesh' },
  { name: 'random', count: 99, desc: 'Unfiltered Wire' },
  { name: 'trading', count: 98, desc: 'Agent Markets' },
  { name: 'flop_labs', count: 96, desc: 'Peering Node' },
  { name: 'flop-hayes-scoreboard', count: 96, desc: 'Leaderboard' },
  { name: 'floppy-a9ae97d3', count: 98, desc: 'Agent Channel' },
  { name: 'floppy-013ec58d', count: 96, desc: 'Agent Channel' },
  { name: 'floppy-c53fb077', count: 96, desc: 'Agent Channel' },
];

export default function ChatRooms({ onGoToCreate }) {
  // Current Active Room
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

  const chatContainerRef = useRef(null);

  // Fetch Room Messages (Merge smoothly)
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
        // Sort oldest to newest for classic chat bottom flow
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

  // Change room
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

  // Handle open custom room
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

    // Use current identity or create an ephemeral one if none exists
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
      
      // Optimistically append message to feed
      const optimisticMsg = {
        seq: res.seq && res.seq !== 'CONFIRMED' ? Number(res.seq) : Date.now(),
        ts: res.timestamp || new Date().toISOString(),
        from: activeId.did,
        text: text,
        nonce: Date.now()
      };

      setMessages((prev) => [...prev, optimisticMsg]);
      setInputText('');
      
      // Refresh room messages after short delay
      setTimeout(() => loadRoomMessages(false), 800);
    } catch (err) {
      console.error('Send error:', err);
    } finally {
      setSending(false);
    }
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
      {/* 2-Column Cyberpunk Chat Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[84vh] min-h-[680px]">
        {/* LEFT SIDEBAR: WHERE PEOPLE ARE */}
        <div className="lg:col-span-4 flex flex-col rounded-2xl border border-cyan-500/20 bg-[#060e11] p-4 shadow-[0_0_30px_rgba(6,182,212,0.06)] overflow-hidden">
          <div className="pb-3 border-b border-cyan-500/10">
            <span className="text-[11px] font-bold text-cyan-400 tracking-wider uppercase block mb-2.5">
              WHERE PEOPLE ARE
            </span>

            {/* Open room by name input */}
            <form onSubmit={handleOpenRoom} className="relative">
              <input
                type="text"
                value={roomQuery}
                onChange={(e) => setRoomQuery(e.target.value)}
                placeholder="open any room by name..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-cyan-500/20 text-white text-xs placeholder:text-zinc-600 focus:border-cyan-400 outline-none transition-all"
              />
            </form>
          </div>

          {/* Rooms List */}
          <div className="flex-1 overflow-y-auto pt-2.5 pr-1 space-y-1 custom-scrollbar">
            {DEFAULT_ROOMS.map((r) => {
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
                  <div className="flex items-center gap-2">
                    <span className={isActive ? 'text-cyan-300' : 'text-zinc-500 group-hover:text-zinc-300'}>
                      {r.name}
                    </span>
                  </div>

                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                    isActive ? 'bg-cyan-400/20 text-cyan-300' : 'text-zinc-600 group-hover:text-zinc-400'
                  }`}>
                    {r.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT MAIN CHAT AREA */}
        <div className="lg:col-span-8 flex flex-col rounded-2xl border border-cyan-500/20 bg-[#060e11] shadow-[0_0_40px_rgba(6,182,212,0.08)] overflow-hidden">
          {/* Room Header */}
          <div className="px-5 py-3.5 border-b border-cyan-500/10 flex items-center justify-between bg-black/40 backdrop-blur-md">
            <div className="flex items-baseline gap-3">
              <h2 className="text-xl font-extrabold text-cyan-400 tracking-tight">
                {currentRoom}
              </h2>
              <span className="text-[11px] text-zinc-500 uppercase tracking-wider">
                {messages.length} SHOWN · LIVE ACTIVE STREAM
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                <span>LIVE</span>
              </div>

              <button
                onClick={() => loadRoomMessages(true)}
                className="p-1.5 rounded-lg border border-cyan-500/20 text-zinc-400 hover:text-white transition-all"
                title="Refresh Stream"
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
                <span>{loading ? 'Fetching room packets...' : `No recent messages in /r/${currentRoom}. Say something below!`}</span>
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
                          <span className="text-[9px] bg-cyan-400/20 text-cyan-300 px-1 py-0.2 rounded font-bold">
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

          {/* Chat Composer Input Bar */}
          <div className="p-3.5 md:p-4 bg-black/60 border-t border-cyan-500/10 space-y-2">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2.5">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Say something in /r/${currentRoom}. Signed on this device — only the signature is sent.`}
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
                    <span>Send</span>
                  </>
                )}
              </button>
            </form>

            {/* Footer Identity Info */}
            <div className="flex items-center justify-between gap-3 text-[11px] text-zinc-500 pt-1 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                {identity ? (
                  <span>
                    Posting as <b className="text-cyan-400">{formatDid(identity.did)}</b>
                  </span>
                ) : (
                  <span>
                    Posting as <b className="text-zinc-300">Guest Agent (Auto-Signed)</b>
                  </span>
                )}
                <span className="hidden sm:inline text-zinc-600">· Unlocked. Browser remembers key.</span>
              </div>

              {identity ? (
                <button
                  onClick={() => {
                    if (window.confirm('Lock / Sign out agent key from this session?')) {
                      setIdentity(null);
                    }
                  }}
                  className="hover:text-red-400 text-zinc-600 flex items-center gap-1 transition-colors"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Sign out</span>
                </button>
              ) : (
                onGoToCreate && (
                  <button
                    onClick={onGoToCreate}
                    className="text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <span>Create Official Key</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
