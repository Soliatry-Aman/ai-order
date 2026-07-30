import React from 'react';
import type { Message } from '../types';

interface Props {
  messages: Message[];
  onPrefill: (text: string) => void;
  onSend: (text: string) => void;
  onDeleteMessage?: (id: string) => void;
  onClose: () => void;
  onClear: () => void;
}

export const HistoryPanel: React.FC<Props> = ({ messages, onPrefill, onSend, onDeleteMessage, onClose, onClear }) => {
  const userMessages = messages.filter(m => m.role === 'user' && m.text);

  return (
    <div className="w-full sm:w-96 flex-shrink-0 bg-slate-900/95 backdrop-blur-2xl border-r border-white/10 flex flex-col h-full z-20 animate-slide-right overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
            <span className="text-base">💬</span>
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Session Activity Log</h2>
            <p className="text-[11px] text-slate-400">{userMessages.length} user queries recorded</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          title="Close panel"
        >
          ✕
        </button>
      </div>

      {/* History items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {userMessages.length > 0 ? (
          userMessages.map((msg, index) => (
            <div
              key={msg.id}
              className="glass-card rounded-2xl p-3 border border-white/8 hover:border-purple-500/40 transition-all duration-200 group relative"
            >
              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1.5">
                <span className="font-semibold uppercase tracking-wider text-purple-400">Query #{index + 1}</span>
                {onDeleteMessage && (
                  <button
                    onClick={() => onDeleteMessage(msg.id)}
                    className="text-slate-500 hover:text-red-400 transition-colors px-1 py-0.5 rounded hover:bg-white/5"
                    title="Delete this query entry"
                  >
                    🗑️ Delete
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-200 font-medium line-clamp-3 leading-relaxed mb-2">
                {msg.text}
              </p>
              <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                <button
                  onClick={() => onPrefill(msg.text!)}
                  className="flex-1 py-1 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-slate-300 hover:text-white transition-colors text-center"
                  title="Copy text to input area"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => onSend(msg.text!)}
                  className="flex-1 py-1 px-2.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-[11px] text-purple-200 hover:text-white border border-purple-500/30 transition-colors text-center font-medium"
                  title="Re-run query immediately"
                >
                  🔁 Re-run
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
            <span className="text-3xl mb-2 opacity-50">📜</span>
            <p className="text-xs font-semibold text-slate-400">No session queries recorded</p>
            <p className="text-[11px] mt-1 text-slate-500">Start asking questions to see your query log here.</p>
          </div>
        )}
      </div>

      {/* Clear session button */}
      {userMessages.length > 0 && (
        <div className="p-3 bg-black/40 border-t border-white/8">
          <button
            onClick={onClear}
            className="w-full py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear All Session History
          </button>
        </div>
      )}
    </div>
  );
};
