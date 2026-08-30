import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CreateAgent from './components/CreateAgent';
import AgentCard from './components/AgentCard';
import ChatRooms from './components/ChatRooms';
import { Terminal, ExternalLink } from 'lucide-react';

const STORAGE_KEY = 'flop_agent_state_v6';

export default function App() {
  const [activeTab, setActiveTab] = useState('create');
  const [currentIdentity, setCurrentIdentity] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).identity : null;
    } catch {
      return null;
    }
  });

  const handleAgentCreated = (identity) => {
    setCurrentIdentity(identity);
  };

  const handleViewCard = (identity) => {
    setCurrentIdentity(identity);
    setActiveTab('card');
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-black text-white selection:bg-white selection:text-black font-mono">
      {/* Hacker Matrix Ambient Gradient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/3 w-[600px] h-[400px] bg-white/[0.03] rounded-full blur-[160px]" />
      </div>

      <div className="relative z-10 flex flex-col flex-1">
        {/* Navigation Bar */}
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Content View */}
        <main className="flex-1">
          {activeTab === 'create' && (
            <CreateAgent 
              onAgentCreated={handleAgentCreated} 
              onViewCard={handleViewCard} 
            />
          )}

          {activeTab === 'card' && (
            <AgentCard initialIdentity={currentIdentity} />
          )}

          {activeTab === 'rooms' && (
            <ChatRooms onGoToCreate={() => setActiveTab('create')} />
          )}
        </main>

        {/* Hacker Footer */}
        <footer className="border-t border-hacker-border py-8 px-4 mt-16 bg-black">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono text-hacker-muted">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white"></span>
              <span>
                FlopLab Tool Built By{' '}
                <a
                  href="https://x.com/MeniyaAnilX"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-hacker-green font-bold transition-colors underline decoration-white/30 underline-offset-4"
                >
                  @MeniyaAnilX
                </a>
              </span>
            </div>

            <div className="flex items-center gap-5 flex-wrap justify-center">
              <a 
                href="https://flop.finance" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>flop.finance</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <a 
                href="https://technocore.chat" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>technocore.chat</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <a 
                href="https://x.com/flop_labs" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>@flop_labs</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <a 
                href="https://x.com/CryptoHayes" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-white hover:text-hacker-green flex items-center gap-1 font-bold transition-colors"
              >
                <span>@CryptoHayes (CEO)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
