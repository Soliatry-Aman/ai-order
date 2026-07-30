import React from 'react';

interface Props {
  onAskPolicy: (policyTopic: string) => void;
  onClose: () => void;
}

const STORE_POLICIES = [
  {
    topic: 'returns',
    title: 'Return & Exchange Policy',
    icon: '↩️',
    summary: 'Unused items may be returned within 30 days of delivery. Custom orders are final sale.',
    query: 'What is your return policy?',
  },
  {
    topic: 'shipping',
    title: 'Shipping & Delivery Policy',
    icon: '🚚',
    summary: 'Standard delivery is 3-5 business days across India. Expedited option available for 1-2 business days.',
    query: 'What are your shipping methods and delivery timelines?',
  },
  {
    topic: 'cancellation',
    title: 'Order Cancellation Policy',
    icon: '🚫',
    summary: 'Orders can be cancelled free of charge if they have not yet shipped. Shipped orders must be returned.',
    query: 'How does order cancellation work?',
  },
];

export const PoliciesPanel: React.FC<Props> = ({ onAskPolicy, onClose }) => {
  return (
    <div className="w-full sm:w-96 flex-shrink-0 bg-slate-900/95 backdrop-blur-2xl border-r border-white/10 flex flex-col h-full z-20 animate-slide-right overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <span className="text-base">📜</span>
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Store Policy Reference</h2>
            <p className="text-[11px] text-slate-400">Instant AI policy lookup guide</p>
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

      {/* Policy list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {STORE_POLICIES.map((p) => (
          <div
            key={p.topic}
            className="glass-card rounded-2xl p-4 border border-white/8 hover:border-amber-500/40 transition-all duration-200 group"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl flex-shrink-0">{p.icon}</span>
              <h3 className="text-xs font-bold text-white group-hover:text-amber-200 transition-colors">
                {p.title}
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              {p.summary}
            </p>
            <button
              onClick={() => onAskPolicy(p.query)}
              className="w-full py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>Ask Assistant About This</span>
              <span className="text-sm">→</span>
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 bg-black/40 border-t border-white/8 text-[11px] text-slate-400 text-center">
        <span>Verified Official Store Guidelines</span>
      </div>
    </div>
  );
};
