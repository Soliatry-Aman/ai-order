import type { ToolCall } from '../types';

interface Props {
  toolCall: ToolCall;
  onApprove: () => void;
  onDeny: () => void;
}

export function ApprovalCard({ toolCall, onApprove, onDeny }: Props) {
  const orderId = (toolCall.args.orderId as string) ?? '—';
  const reason = (toolCall.args.reason as string) ?? '—';

  return (
    <div className="mt-3 rounded-2xl overflow-hidden border border-amber-500/30 bg-amber-950/40 animate-slide-up">
      {/* Header banner */}
      <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/10 border-b border-amber-500/20">
        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
          <span className="text-base">⚠️</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-amber-300">Action Requires Your Approval</p>
          <p className="text-xs text-amber-400/70">This action is irreversible. Please review carefully.</p>
        </div>
      </div>

      {/* Details */}
      <div className="px-4 py-3 space-y-3">
        <p className="text-xs text-slate-400">
          The assistant wants to <span className="font-mono font-bold text-amber-300 bg-amber-900/40 px-1.5 py-0.5 rounded">cancel_order</span>
        </p>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-black/30 rounded-xl p-3 border border-white/5">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Order ID</p>
            <p className="text-sm font-mono font-bold text-white">#{orderId}</p>
          </div>
          <div className="bg-black/30 rounded-xl p-3 border border-white/5">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Reason</p>
            <p className="text-xs text-slate-300 leading-relaxed">{reason}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-4 pb-4">
        <button
          onClick={onDeny}
          className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/5 hover:border-white/20 transition-all duration-200"
        >
          Deny Request
        </button>
        <button
          onClick={onApprove}
          className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-all duration-200 glow-red shadow-lg"
        >
          ✓ Approve Cancellation
        </button>
      </div>
    </div>
  );
}
