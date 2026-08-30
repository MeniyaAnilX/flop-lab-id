import React, { useState, useEffect, Component } from 'react';
import Navbar from './components/Navbar';
import CreateAgent from './components/CreateAgent';
import AgentCard from './components/AgentCard';
import ChatRooms from './components/ChatRooms';
import { Terminal, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';

const STORAGE_KEY = 'flop_agent_state_v6';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('FlopLab Runtime Error caught by Boundary:', error, errorInfo);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.tabKey !== this.props.tabKey && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white p-6 font-mono">
          <div className="max-w-md w-full p-6 rounded-2xl bg-hacker-card border border-red-500/40 space-y-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-white">Temporary Session Glitch Recovered</h2>
            <p className="text-xs text-hacker-muted leading-relaxed">
              {this.state.error?.message || 'An unexpected state error occurred. Click below to safely reset and continue.'}
            </p>
            <button
              onClick={() => {
                localStorage.removeItem(STORAGE_KEY);
                window.location.reload();
              }}
              className="btn-white w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Session & Reload</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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
    <ErrorBoundary tabKey={activeTab}>
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
    </ErrorBoundary>
  );
}
