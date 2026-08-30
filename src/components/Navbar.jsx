import React from 'react';
import { ShieldCheck, PlusCircle, CreditCard, Search, Radio, Sparkles } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'create', label: '1-Click Creator', icon: PlusCircle },
    { id: 'card', label: 'Agent ID Card', icon: CreditCard },
    { id: 'verify', label: 'Airdrop Check', icon: Search },
    { id: 'rooms', label: 'Live Explorer', icon: Radio },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-void/80 border-b border-navy-600/60 px-4 md:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('create')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-flop-glow via-flop to-navy-800 flex items-center justify-center shadow-[0_0_20px_rgba(0,180,216,0.5)] group-hover:scale-105 transition-transform duration-300">
            <Sparkles className="w-5 h-5 text-void" />
            <div className="absolute inset-0 rounded-xl bg-flop-glow opacity-30 blur-md animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-extrabold text-xl tracking-tight text-ice group-hover:text-flop-glow transition-colors">
              <span>FLOP LAB</span>
              <span className="text-flop bg-flop/10 px-1.5 py-0.5 rounded text-sm border border-flop/30">ID</span>
            </div>
            <p className="text-[10px] font-mono text-flop-dark uppercase tracking-widest -mt-0.5">Technocore Agent Suite</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 md:gap-2 bg-navy-900/80 p-1 rounded-2xl border border-navy-600/50 shadow-inner">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'btn-cyan shadow-md'
                    : 'text-ice/70 hover:text-ice hover:bg-navy-800/80'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-void' : 'text-flop'}`} />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Network Live Pulse */}
        <div className="hidden lg:flex items-center gap-2.5 bg-navy-900/60 border border-navy-600/40 px-3.5 py-1.5 rounded-full text-xs font-mono">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-ice/70">Technocore Live</span>
        </div>
      </div>
    </header>
  );
}
