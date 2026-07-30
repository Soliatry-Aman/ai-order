import React from 'react';

interface Props {
  onClose: () => void;
}

export const HelpModal: React.FC<Props> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="w-full max-w-lg glass rounded-3xl border border-white/12 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xl">
              💡
            </div>
            <div>
              <h2 className="text-base font-bold text-white">System Capabilities & Tips</h2>
              <p className="text-xs text-slate-400">Everything you can ask the AI Order Assistant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Available AI Tools */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
            ⚡ Active Autonomous AI Tools
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3 bg-white/4 border border-white/8 rounded-2xl">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">📦</span>
                <span className="font-mono text-xs font-bold text-white">get_order</span>
              </div>
              <p className="text-[11px] text-slate-400">Fetches live status, customer, items, total price, and tracking link.</p>
            </div>

            <div className="p-3 bg-white/4 border border-white/8 rounded-2xl">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">🏭</span>
                <span className="font-mono text-xs font-bold text-white">check_inventory</span>
              </div>
              <p className="text-[11px] text-slate-400">Queries warehouse stock count, SKU details, and restock date.</p>
            </div>

            <div className="p-3 bg-white/4 border border-white/8 rounded-2xl">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">📋</span>
                <span className="font-mono text-xs font-bold text-white">lookup_policy</span>
              </div>
              <p className="text-[11px] text-slate-400">Retrieves store guidelines for returns, shipping, and cancellations.</p>
            </div>

            <div className="p-3 bg-white/4 border border-white/8 rounded-2xl">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">🚫</span>
                <span className="font-mono text-xs font-bold text-white">cancel_order</span>
              </div>
              <p className="text-[11px] text-slate-400">Triggers cancellation approval workflow before executing.</p>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="space-y-3 pt-2 border-t border-white/10">
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
            ⌨️ Keyboard Shortcuts
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl bg-black/20">
              <span className="text-slate-300">Send Message</span>
              <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-white/10 text-indigo-300 font-mono text-[10px]">Enter</kbd>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-black/20">
              <span className="text-slate-300">Insert Line Break</span>
              <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-white/10 text-indigo-300 font-mono text-[10px]">Shift + Enter</kbd>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-black/20">
              <span className="text-slate-300">Quick Catalog Lookup</span>
              <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-white/10 text-indigo-300 font-mono text-[10px]">Catalog Icon in Navigation</kbd>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
