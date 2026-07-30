
import { useState, useCallback } from 'react';
import { useChat } from './hooks/useChat';
import { ChatWindow } from './components/ChatWindow';
import { MessageInput } from './components/MessageInput';

function App() {
  const {
    messages,
    isLoading,
    pendingApproval,
    sendMessage,
    clearChat,
    stop,
    handleApproval,
  } = useChat();

  // Prefill state: a prompt template clicked by the user that populates the input
  const [prefillText, setPrefillText] = useState<string | undefined>();
  const handlePrefill = useCallback((text: string) => setPrefillText(text), []);
  const handlePrefillConsumed = useCallback(() => setPrefillText(undefined), []);

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Decorative background gradient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-pink-600/5 blur-3xl" />
      </div>

      {/* Main layout */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative">
        <div className="w-full max-w-3xl h-full max-h-[900px] flex flex-col glass rounded-3xl overflow-hidden shadow-2xl">

          {/* ── Header ─────────────────────────────────────────────────── */}
          <header className="flex items-center justify-between px-6 py-4 border-b border-white/8 bg-white/2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                <span className="text-xl">📦</span>
              </div>
              <div>
                <h1 className="text-base font-bold text-white leading-tight">AI Order Assistant</h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-[11px] text-slate-400">Support Rep Dashboard</p>
                </div>
              </div>
            </div>

            <button
              onClick={clearChat}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-white/8 border border-transparent hover:border-white/10 transition-all duration-200"
              title="Start new conversation"
              aria-label="New conversation"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Chat
            </button>
          </header>

          {/* ── Chat Area ──────────────────────────────────────────────── */}
          <ChatWindow
            messages={messages}
            isLoading={isLoading}
            pendingApproval={pendingApproval}
            onApprove={handleApproval}
            onSend={sendMessage}
            onPrefill={handlePrefill}
          />

          {/* ── Input Area ─────────────────────────────────────────────── */}
          <MessageInput
            onSend={sendMessage}
            onStop={stop}
            isLoading={isLoading}
            disabled={!!pendingApproval}
            prefillText={prefillText}
            onPrefillConsumed={handlePrefillConsumed}
          />
        </div>

        {/* Footer attribution */}
        <p className="mt-3 text-[10px] text-slate-600 text-center">
          Powered by Multi-Provider AI Engine · All data is mock / local only
        </p>
      </div>
    </div>
  );
}

export default App;
