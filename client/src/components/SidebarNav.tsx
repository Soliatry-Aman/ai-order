import React from 'react';

export type NavTab = 'chat' | 'history' | 'policies';

interface Props {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onNewChat: () => void;
  messageCount: number;
}

export const SidebarNav: React.FC<Props> = ({
  activeTab,
  onTabChange,
  onOpenSettings,
  onOpenHelp,
  onNewChat,
  messageCount,
}) => {
  return (
    <aside className="w-16 sm:w-18 flex-shrink-0 flex flex-col items-center justify-between py-5 bg-slate-950/80 backdrop-blur-2xl border-r border-white/8 relative z-30 select-none">
      {/* Top Section: Logo + Primary Navigation Icons */}
      <div className="flex flex-col items-center gap-6 w-full">
        {/* Brand Logo */}
        <button
          onClick={() => onTabChange('chat')}
          className="relative group focus:outline-none"
          title="ShopDesk Support Home"
        >
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200">
            <span className="text-xl">📦</span>
          </div>
          <div className="absolute left-14 top-2 px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-md border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
            ShopDesk Workspace
          </div>
        </button>

        {/* Divider */}
        <div className="w-8 h-[1px] bg-white/10" />

        {/* Navigation Tabs */}
        <nav className="flex flex-col items-center gap-3 w-full px-2">
          {/* 1. Chat Tab (Speech Bubble) */}
          <button
            onClick={() => onTabChange('chat')}
            className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 group ${
              activeTab === 'chat'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-white/6'
            }`}
            title="Support Workspace Chat"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {messageCount > 0 && activeTab !== 'chat' && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
            )}
            <div className="absolute left-14 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-md border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
              Support Workspace Chat
            </div>
          </button>

          {/* 2. History Tab (Chat Bubbles) */}
          <button
            onClick={() => onTabChange('history')}
            className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 group ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-white/6'
            }`}
            title="Session Activity Log"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H7a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
            <div className="absolute left-14 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-md border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
              Session Activity Log
            </div>
          </button>

          {/* 3. Policies Tab (Document Icon) */}
          <button
            onClick={() => onTabChange('policies')}
            className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 group ${
              activeTab === 'policies'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-white/6'
            }`}
            title="Policies & Rules Reference"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="absolute left-14 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-md border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
              Store Policy Reference
            </div>
          </button>
        </nav>
      </div>

      {/* Bottom Section: Settings, Help, New Session */}
      <div className="flex flex-col items-center gap-3 w-full px-2">
        {/* Settings (Gear) */}
        <button
          onClick={onOpenSettings}
          className="relative w-11 h-11 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/6 transition-all duration-200 group"
          title="App Settings"
        >
          <svg className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <div className="absolute left-14 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-md border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
            Settings & Density
          </div>
        </button>

        {/* Help (?) */}
        <button
          onClick={onOpenHelp}
          className="relative w-11 h-11 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/6 transition-all duration-200 group"
          title="System Capabilities & Tips"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="absolute left-14 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-md border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
            Guide & Shortcuts
          </div>
        </button>

        {/* New Session (Exit Arrow) */}
        <button
          onClick={onNewChat}
          className="relative w-11 h-11 rounded-2xl flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 group"
          title="Reset / Start New Session"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <div className="absolute left-14 px-2.5 py-1 bg-slate-900 text-red-300 text-xs font-medium rounded-md border border-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
            Reset Session
          </div>
        </button>
      </div>
    </aside>
  );
};
