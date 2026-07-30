import React from 'react';
import type { ToolCall } from '../types';

interface Props {
  toolCall: ToolCall;
  onApprove: () => void;
  onDeny: () => void;
}

export const ApprovalCard: React.FC<Props> = ({ toolCall, onApprove, onDeny }) => {
  const orderId = (toolCall.args.orderId as string) ?? (toolCall.args.order_id as string) ?? '—';
  const reason  = (toolCall.args.reason as string) ?? 'Customer requested cancellation via assistant';

  return (
    <div className="mt-3.5 rounded-2xl overflow-hidden border border-amber-500/40 bg-amber-950/40 shadow-2xl animate-slide-up">
      {/* Header Banner */}
      <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/15 border-b border-amber-500/25">
        <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0 animate-pulse">
          <span className="text-lg">⚠️</span>
        </div>
        <div>
          <p className="text-xs font-bold text-amber-200 uppercase tracking-wider">Human Approval Required</p>
          <p className="text-[11px] text-amber-300/80 mt-0.5">Cancelling an order is irreversible. Please confirm action.</p>
        </div>
      </div>

      {/* Details Box */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Requested Tool Action:</span>
          <span className="font-mono font-bold text-amber-300 bg-amber-900/50 px-2 py-0.5 rounded-md border border-amber-500/30">
            cancel_order
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-black/40 rounded-xl p-3 border border-white/5">
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Target Order</p>
            <p className="text-sm font-mono font-bold text-white">#{orderId}</p>
          </div>
          <div className="bg-black/40 rounded-xl p-3 border border-white/5">
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Reason Stated</p>
            <p className="text-xs text-slate-200 leading-snug line-clamp-2">{reason}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2.5 px-4 pb-4">
        <button
          onClick={onDeny}
          className="flex-1 py-2.5 rounded-xl border border-white/12 text-slate-300 text-xs font-bold hover:bg-white/8 hover:text-white transition-all duration-200 cursor-pointer"
        >
          ✕ Deny Request
        </button>
        <button
          onClick={onApprove}
          className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all duration-200 glow-red shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
        >
          ✓ Approve Cancellation
        </button>
      </div>
    </div>
  );
};
