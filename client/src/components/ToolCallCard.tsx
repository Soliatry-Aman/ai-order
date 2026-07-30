import { useState } from 'react';
import type { ReactNode } from 'react';
import type { ToolCall, ToolResult } from '../types';

interface Props {
  toolCall: ToolCall;
  toolResult?: ToolResult;
}

// Tool metadata mapping
const TOOL_META: Record<string, { icon: string; label: string; color: string }> = {
  get_order:        { icon: '📦', label: 'Fetching Order Details',  color: 'indigo'  },
  check_inventory:  { icon: '🏭', label: 'Checking Stock Levels',   color: 'sky'     },
  lookup_policy:    { icon: '📋', label: 'Searching Store Policy',   color: 'amber'   },
  cancel_order:     { icon: '🚫', label: 'Executing Cancellation', color: 'red'     },
};

const COLOR_MAP: Record<string, { badge: string; bar: string; icon: string }> = {
  indigo: {
    badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    bar:   'bg-indigo-500/60',
    icon:  'bg-indigo-500/20 border-indigo-500/30',
  },
  sky: {
    badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    bar:   'bg-sky-500/60',
    icon:  'bg-sky-500/20 border-sky-500/30',
  },
  amber: {
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    bar:   'bg-amber-500/60',
    icon:  'bg-amber-500/20 border-amber-500/30',
  },
  red: {
    badge: 'bg-red-500/15 text-red-300 border-red-500/30',
    bar:   'bg-red-500/60',
    icon:  'bg-red-500/20 border-red-500/30',
  },
  gray: {
    badge: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    bar:   'bg-slate-500/60',
    icon:  'bg-slate-500/20 border-slate-500/30',
  },
};

const STATUS_BADGE: Record<string, ReactNode> = {
  loading: (
    <span className="flex items-center gap-1.5 text-[11px] text-indigo-300 font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
      Running Tool…
    </span>
  ),
  done: (
    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
      ✓ Complete
    </span>
  ),
  error: (
    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/20 text-red-300 border border-red-500/30">
      ✕ Error
    </span>
  ),
  denied: (
    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500/20 text-orange-300 border border-orange-500/30">
      ⊘ Denied
    </span>
  ),
};

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 border-b border-white/5 last:border-0">
      <span className="text-slate-400 text-[11px] uppercase tracking-wider flex-shrink-0 pt-0.5 font-medium">{label}</span>
      <span className={`text-right text-[12px] font-semibold break-words max-w-[68%] ${highlight ? 'text-indigo-200' : 'text-slate-200'}`}>{value}</span>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s === 'shipped' || s === 'delivered')
    return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">🚚 {capitalize(s)}</span>;
  if (s === 'pending' || s === 'processing')
    return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">⏳ {capitalize(s)}</span>;
  if (s === 'cancelled' || s === 'canceled')
    return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/20 text-red-300 border border-red-500/30">✕ {capitalize(s)}</span>;
  return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-500/20 text-slate-300 border border-slate-500/30">{capitalize(s)}</span>;
}

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
function formatCurrency(n: number) { return `₹${n.toLocaleString('en-IN')}`; }

function GetOrderResult({ result }: { result: Record<string, unknown> }) {
  if (result.error) return <p className="text-red-300 text-xs py-1">{String(result.error)}</p>;
  return (
    <div className="space-y-1">
      {!!result.id && <Row label="Order ID" value={`#${result.id}`} highlight />}
      {!!result.customer && <Row label="Customer" value={String(result.customer)} />}
      {!!result.status && (
        <div className="flex items-center justify-between py-1.5 border-b border-white/5">
          <span className="text-slate-400 text-[11px] uppercase tracking-wider font-medium">Status</span>
          <StatusPill status={String(result.status)} />
        </div>
      )}
      {result.total !== undefined && (
        <Row label="Total Amount" value={formatCurrency(Number(result.total))} highlight />
      )}
      {!!result.items && Array.isArray(result.items) && result.items.length > 0 && (
        <div className="pt-1.5 pb-1">
          <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold mb-1.5">Items Purchased</p>
          <div className="space-y-1 bg-black/25 p-2 rounded-xl border border-white/5">
            {(result.items as Record<string, unknown>[]).map((item, i) => (
              <div key={i} className="text-xs text-slate-200 flex justify-between font-medium">
                <span>{String(item.name ?? item.sku ?? item.id ?? 'Item')}</span>
                <span className="text-indigo-300 font-bold">× {String(item.qty ?? item.quantity ?? 1)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CheckInventoryResult({ result }: { result: Record<string, unknown> }) {
  if (result.error) return <p className="text-red-300 text-xs py-1">{String(result.error)}</p>;
  const qty = Number(result.inStock ?? result.quantity ?? result.qty ?? result.stock ?? 0);
  const isLow = qty < 10;
  const isOut = qty === 0;
  const maxStock = 250;
  const percentage = Math.min(Math.round((qty / maxStock) * 100), 100);

  return (
    <div className="space-y-2">
      {!!result.sku && <Row label="SKU" value={String(result.sku)} highlight />}
      {!!result.name && <Row label="Product Name" value={String(result.name)} />}
      
      {/* Visual Stock Meter Gauge */}
      <div className="py-2 px-3 bg-black/30 rounded-xl border border-white/5 space-y-1.5">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-400">Available Inventory</span>
          <span className={isOut ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-emerald-400'}>
            {qty} units {isOut ? '(Out of Stock)' : isLow ? '(Low Stock)' : '(In Stock)'}
          </span>
        </div>
        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isOut ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.max(percentage, isOut ? 0 : 5)}%` }}
          />
        </div>
      </div>

      {!!result.restockDate && (
        <Row label="Expected Restock" value={String(result.restockDate)} highlight />
      )}
    </div>
  );
}

function LookupPolicyResult({ result }: { result: Record<string, unknown> }) {
  if (result.error) return <p className="text-red-300 text-xs py-1">{String(result.error)}</p>;
  const text = String(result.body ?? result.policy ?? result.text ?? result.content ?? '');
  return (
    <div className="bg-black/25 p-3 rounded-xl border border-white/5 space-y-1">
      {!!result.topic && (
        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
          {String(result.topic)}
        </span>
      )}
      <p className="text-slate-200 text-xs leading-relaxed pt-1">{text}</p>
    </div>
  );
}

function CancelOrderResult({ result }: { result: Record<string, unknown> }) {
  if (result.denied) return (
    <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs flex items-center gap-2">
      <span className="text-base">⊘</span>
      <span>Order cancellation request was denied by user.</span>
    </div>
  );
  if (result.error) return <p className="text-red-300 text-xs">{String(result.error)}</p>;
  return (
    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
      <span className="text-base">✓</span>
      <span className="font-semibold">{String(result.message ?? 'Order cancelled successfully.')}</span>
    </div>
  );
}

function GenericResult({ result }: { result: Record<string, unknown> }) {
  return (
    <div className="space-y-1">
      {Object.entries(result).map(([k, v]) => (
        <Row key={k} label={k.replace(/_/g, ' ')} value={typeof v === 'object' ? JSON.stringify(v) : String(v)} />
      ))}
    </div>
  );
}

function ResultBody({ toolName, result }: { toolName: string; result: unknown }) {
  if (!result || typeof result !== 'object') {
    return <p className="text-slate-200 text-xs">{String(result)}</p>;
  }
  const r = result as Record<string, unknown>;
  switch (toolName) {
    case 'get_order':       return <GetOrderResult result={r} />;
    case 'check_inventory': return <CheckInventoryResult result={r} />;
    case 'lookup_policy':   return <LookupPolicyResult result={r} />;
    case 'cancel_order':    return <CancelOrderResult result={r} />;
    default:                return <GenericResult result={r} />;
  }
}

function argSummary(toolName: string, args: Record<string, unknown>): string {
  switch (toolName) {
    case 'get_order':       return `Order #${args.orderId ?? args.order_id ?? '?'}`;
    case 'check_inventory': return `SKU: ${args.sku ?? args.productId ?? '?'}`;
    case 'lookup_policy':   return `Topic: ${args.topic ?? args.query ?? '?'}`;
    case 'cancel_order':    return `Order #${args.orderId ?? args.order_id ?? '?'}`;
    default:                return Object.values(args).join(', ');
  }
}

export function ToolCallCard({ toolCall, toolResult }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const meta   = TOOL_META[toolCall.name] ?? { icon: '🔧', label: toolCall.name, color: 'gray' };
  const colors = COLOR_MAP[meta.color] ?? COLOR_MAP.gray;

  const isError  = toolResult && typeof toolResult.result === 'object' && toolResult.result !== null &&
    ('error' in (toolResult.result as Record<string, unknown>) || 'denied' in (toolResult.result as Record<string, unknown>));
  const isDone   = !!toolResult;
  const isDenied = toolResult && typeof toolResult.result === 'object' && toolResult.result !== null &&
    'denied' in (toolResult.result as Record<string, unknown>);

  const statusKey = !isDone ? 'loading' : isDenied ? 'denied' : isError ? 'error' : 'done';

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!toolResult) return;
    navigator.clipboard.writeText(JSON.stringify(toolResult.result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2.5 rounded-2xl overflow-hidden border border-white/10 glass-card animate-fade-in transition-all">
      {/* Header Bar */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full px-3.5 py-3 flex items-center justify-between gap-3 hover:bg-white/5 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-8 h-8 rounded-xl border flex items-center justify-center flex-shrink-0 text-base shadow-sm ${colors.icon}`}>
            {meta.icon}
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-bold leading-tight">{meta.label}</p>
            <p className="text-slate-400 font-mono text-[11px] truncate mt-0.5">{argSummary(toolCall.name, toolCall.args)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          {STATUS_BADGE[statusKey]}

          {isDone && (
            <span
              onClick={handleCopy}
              className="text-[11px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Copy result JSON"
            >
              {copied ? '✓ Copied' : '📋 Copy'}
            </span>
          )}

          <svg
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {!isDone && (
        <div className="h-0.5 w-full overflow-hidden">
          <div className={`h-full ${colors.bar} animate-progress-bar`} />
        </div>
      )}

      {expanded && (
        <div className="border-t border-white/8 px-4 pt-3 pb-3.5 animate-fade-in bg-black/20">
          {isDone ? (
            <ResultBody toolName={toolCall.name} result={toolResult!.result} />
          ) : (
            <p className="text-slate-400 text-[11px] italic">Executing AI tool call on store database…</p>
          )}
        </div>
      )}
    </div>
  );
}
