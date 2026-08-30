import { Terminal, PlusCircle, CreditCard, MessageSquare, Radio, Shield } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'create', label: 'Create', icon: PlusCircle, path: '/create' },
    { id: 'card', label: 'Card', icon: CreditCard, path: '/' },
    { id: 'rooms', label: 'Chat Rooms', icon: MessageSquare, path: '/rooms' },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-black/90 border-b border-hacker-border px-4 md:px-8 py-3.5 transition-all font-mono">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Hacker Logo */}
        <div 
          onClick={() => setActiveTab('create')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-9 h-9 rounded-lg bg-white text-black flex items-center justify-center font-bold text-base shadow-[0_0_15px_rgba(255,255,255,0.4)] group-hover:scale-105 transition-transform duration-200">
            <Terminal className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-lg tracking-tight text-white group-hover:text-hacker-green transition-colors">
              <span>FLOPLAB</span>
            </div>
            <p className="text-[9px] text-hacker-muted uppercase tracking-widest -mt-0.5">// autonomous agent id</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 bg-hacker-card p-1 rounded-xl border border-hacker-border">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-150 ${
                  isActive
                    ? 'btn-white shadow-sm'
                    : 'text-hacker-dim hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Terminal Status Live */}
        <div className="hidden lg:flex items-center gap-2.5 bg-hacker-card border border-hacker-border px-3 py-1.5 rounded-lg text-[11px] text-hacker-muted">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-hacker-green opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-hacker-green"></span>
          </span>
          <span className="text-white font-mono font-medium">Technocore: ONLINE</span>
        </div>
      </div>
    </header>
  );
}
