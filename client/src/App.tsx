import { useState, useCallback, useEffect } from 'react';
import { useChat } from './hooks/useChat';
import { SidebarNav } from './components/SidebarNav';
import type { NavTab } from './components/SidebarNav';
import { HistoryPanel } from './components/HistoryPanel';
import { PoliciesPanel } from './components/PoliciesPanel';
import { SettingsModal } from './components/SettingsModal';
import type { ThemeMode, FontSize } from './components/SettingsModal';
import { HelpModal } from './components/HelpModal';
import { ChatWindow } from './components/ChatWindow';
import { MessageInput } from './components/MessageInput';

function App() {
  const {
    messages,
    isLoading,
    pendingApproval,
    sendMessage,
    clearChat,
    deleteMessage,
    stop,
    handleApproval,
  } = useChat();

  const [activeTab, setActiveTab] = useState<NavTab>('chat');
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>('indigo');
  const [fontSize, setFontSize] = useState<FontSize>('normal');
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [prefillText, setPrefillText] = useState<string | undefined>();
  const handlePrefill = useCallback((text: string) => {
    setPrefillText(text);
    setActiveTab('chat');
  }, []);

  const handlePrefillConsumed = useCallback(() => setPrefillText(undefined), []);

  const handleAskPolicy = (query: string) => {
    sendMessage(query);
    setActiveTab('chat');
  };

  useEffect(() => {
    document.body.className = `theme-${theme}`;
  }, [theme]);

  return (
    <div className={`flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 ${
      fontSize === 'compact' ? 'text-xs' : fontSize === 'large' ? 'text-base' : 'text-sm'
    }`}>
      {/* Subtle Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] rounded-full bg-indigo-900/10 blur-[140px]" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] rounded-full bg-slate-800/20 blur-[140px]" />
      </div>

      {/* Vertical Navigation Bar */}
      <SidebarNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenSettings={() => setShowSettings(true)}
        onOpenHelp={() => setShowHelp(true)}
        onNewChat={clearChat}
        messageCount={messages.length}
      />

      {/* Slide-out Side Panels */}
      {activeTab === 'history' && (
        <HistoryPanel
          messages={messages}
          onPrefill={handlePrefill}
          onSend={(text) => { sendMessage(text); setActiveTab('chat'); }}
          onDeleteMessage={deleteMessage}
          onClose={() => setActiveTab('chat')}
          onClear={clearChat}
        />
      )}

      {activeTab === 'policies' && (
        <PoliciesPanel
          onAskPolicy={handleAskPolicy}
          onClose={() => setActiveTab('chat')}
        />
      )}

      {/* Main Support Workspace Canvas */}
      <main className="flex-1 flex flex-col items-center justify-center p-3 sm:p-5 relative z-10 min-w-0">
        <div className="w-full max-w-4xl h-full flex flex-col bg-slate-900/80 backdrop-blur-2xl rounded-2xl overflow-hidden shadow-2xl border border-white/10">

          {/* Top Dashboard Header - Clean SaaS Style */}
          <header className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-slate-950/60 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm shadow-sm">
                SD
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400">ShopDesk / Support Desk</span>
                  <span className="text-slate-600">/</span>
                  <h1 className="text-xs sm:text-sm font-bold text-white leading-tight">Live Orders Workspace</h1>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <p className="text-[11px] text-slate-400 font-medium">Store Database Synced · Live API Connected</p>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={clearChat}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                title="Start new conversation"
              >
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline font-medium">New Session</span>
              </button>
            </div>
          </header>

          {/* Main Chat Canvas */}
          <ChatWindow
            messages={messages}
            isLoading={isLoading}
            pendingApproval={pendingApproval}
            onApprove={handleApproval}
            onSend={sendMessage}
            onPrefill={handlePrefill}
            onDeleteMessage={deleteMessage}
          />

          {/* Floating Message Input Bar */}
          <MessageInput
            onSend={sendMessage}
            onStop={stop}
            isLoading={isLoading}
            disabled={!!pendingApproval}
            prefillText={prefillText}
            onPrefillConsumed={handlePrefillConsumed}
          />
        </div>

        {/* Clean Footer Attribution */}
        <p className="mt-2 text-[11px] text-slate-500 text-center font-medium">
          ShopDesk Support Workspace · Internal Order Management System
        </p>
      </main>

      {/* Modals */}
      {showSettings && (
        <SettingsModal
          currentTheme={theme}
          onChangeTheme={setTheme}
          fontSize={fontSize}
          onChangeFontSize={setFontSize}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(v => !v)}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showHelp && (
        <HelpModal onClose={() => setShowHelp(false)} />
      )}
    </div>
  );
}

export default App;
