import { useState } from 'react';
import type { ReactNode } from 'react';
import type { ToolCall, ToolResult } from '../types';

interface Props {
  toolCall: ToolCall;
  toolResult?: ToolResult;
}

// ── Tool meta ──────────────────────────────────────────────────────────────────
const TOOL_META: Record<string, { icon: string; label: string; color: string }> = {
  get_order:        { icon: '📦', label: 'Fetching Order',       color: 'indigo'  },
  check_inventory:  { icon: '🏭', label: 'Checking Inventory',   color: 'sky'     },
  lookup_policy:    { icon: '📋', label: 'Looking Up Policy',    color: 'amber'   },
  cancel_order:     { icon: '🚫', label: 'Cancelling Order',     color: 'red'     },
};

const COLOR_MAP: Record<string, { badge: string; bar: string; icon: string }> = {
  indigo: {
    badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    bar:   'bg-indigo-500/40',
    icon:  'bg-indigo-500/20 border-indigo-500/30',
  },
  sky: {
    badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    bar:   'bg-sky-500/40',
    icon:  'bg-sky-500/20 border-sky-500/30',
  },
  amber: {
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    bar:   'bg-amber-500/40',
    icon:  'bg-amber-500/20 border-amber-500/30',
  },
  red: {
    badge: 'bg-red-500/15 text-red-300 border-red-500/30',
    bar:   'bg-red-500/40',
    icon:  'bg-red-500/20 border-red-500/30',
  },
  gray: {
    badge: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    bar:   'bg-slate-500/40',
    icon:  'bg-slate-500/20 border-slate-500/30',
  },
};

// ── Status badge ───────────────────────────────────────────────────────────────
const STATUS_BADGE: Record<string, ReactNode> = {
  loading: <span className="flex items-center gap-1 text-[10px] text-slate-400"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />Working…</span>,
  done:    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">✓ Done</span>,
  error:   <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/20 text-red-300 border border-red-500/30">✕ Failed</span>,
  denied:  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500/20 text-orange-300 border border-orange-500/30">⊘ Denied</span>,
};

// ── Field renderer ─────────────────────────────────────────────────────────────
function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 border-b border-white/5 last:border-0">
      <span className="text-slate-500 text-[11px] uppercase tracking-wide flex-shrink-0 pt-0.5">{label}</span>
      <span className={`text-right text-[12px] font-medium break-words max-w-[65%] ${highlight ? 'text-white' : 'text-slate-300'}`}>{value}</span>
    </div>
  );
}

// ── Status pill ────────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s === 'shipped' || s === 'delivered')
    return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">🚚 {capitalize(s)}</span>;
  if (s === 'pending' || s === 'processing')
    return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">⏳ {capitalize(s)}</span>;
  if (s === 'cancelled' || s === 'canceled')
    return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/20 text-red-300 border border-red-500/30">✕ {capitalize(s)}</span>;
  return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-500/20 text-slate-300 border border-slate-500/30">{capitalize(s)}</span>;
}

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
function formatCurrency(n: number) { return `₹${n.toLocaleString('en-IN')}`; }

// ── Friendly result renderers per tool ────────────────────────────────────────
function GetOrderResult({ result }: { result: Record<string, unknown> }) {
  if (result.error) return <p className="text-red-300 text-xs">{String(result.error)}</p>;
  return (
    <div className="space-y-0.5">
      {!!result.id        && <Row label="Order ID"  value={`#${result.id}`} highlight />}
      {!!result.customer  && <Row label="Customer"  value={String(result.customer)} />}
      {!!result.status    && (
        <div className="flex items-center justify-between py-1.5 border-b border-white/5">
          <span className="text-slate-500 text-[11px] uppercase tracking-wide">Status</span>
          <StatusPill status={String(result.status)} />
        </div>
      )}
      {result.total !== undefined && (
        <Row label="Total" value={formatCurrency(Number(result.total))} />
      )}
      {!!result.items && Array.isArray(result.items) && result.items.length > 0 && (
        <div className="pt-1">
          <p className="text-slate-500 text-[10px] uppercase tracking-wide mb-1">Items</p>
          <ul className="space-y-1">
            {(result.items as Record<string, unknown>[]).map((item, i) => (
              <li key={i} className="text-[11px] text-slate-300 flex justify-between">
                <span>{String(item.name ?? item.sku ?? item.id ?? 'Item')}</span>
                <span className="text-slate-500">× {String(item.qty ?? item.quantity ?? 1)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!!result.tracking  && <Row label="Tracking"  value={String(result.tracking)} />}
      {!!result.estimated && <Row label="ETA"        value={String(result.estimated)} />}
    </div>
  );
}

function CheckInventoryResult({ result }: { result: Record<string, unknown> }) {
  if (result.error) return <p className="text-red-300 text-xs">{String(result.error)}</p>;
  // `inStock` is the actual field name in db.json
  const qty = Number(result.inStock ?? result.quantity ?? result.qty ?? result.stock ?? 0);
  const isLow = qty < 10;
  const restock = result.restockDate ?? result.restock_date ?? result.restock ?? null;
  return (
    <div className="space-y-0.5">
      {!!result.sku      && <Row label="SKU"      value={String(result.sku)} highlight />}
      {!!result.name     && <Row label="Product"  value={String(result.name)} />}
      <div className="flex items-center justify-between py-1.5 border-b border-white/5">
        <span className="text-slate-500 text-[11px] uppercase tracking-wide">Stock</span>
        <span className={`text-[12px] font-bold ${isLow ? 'text-red-300' : 'text-emerald-300'}`}>
          {qty} units {isLow ? '⚠️ Low' : '✓ Available'}
        </span>
      </div>
      {!!restock          && <Row label="Restock Date" value={String(restock)} />}
      {!!result.warehouse && <Row label="Warehouse" value={String(result.warehouse)} />}
      {!!result.reorder   && <Row label="Reorder at" value={`${result.reorder} units`} />}
    </div>
  );
}

function LookupPolicyResult({ result }: { result: Record<string, unknown> }) {
  if (result.error) return <p className="text-red-300 text-xs">{String(result.error)}</p>;
  // db.json stores the text in `body` — also handle other field names as fallback
  const text = String(result.body ?? result.policy ?? result.text ?? result.content ?? result.summary ?? '');
  return (
    <div>
      {!!result.title && <p className="text-slate-200 text-[12px] font-semibold mb-1.5">{String(result.title)}</p>}
      {!!result.topic && <p className="text-slate-400 text-[10px] uppercase tracking-wide mb-1">Topic: {String(result.topic)}</p>}
      {!!text && <p className="text-slate-300 text-[11px] leading-relaxed">{text.slice(0, 280)}{text.length > 280 ? '…' : ''}</p>}
      {!text && <p className="text-slate-500 text-[11px] italic">No policy content found.</p>}
    </div>
  );
}

function CancelOrderResult({ result }: { result: Record<string, unknown> }) {
  if (result.denied) return (
    <div className="flex items-center gap-2 text-orange-300 text-[12px]">
      <span className="text-base">⊘</span>
      <span>Cancellation was denied by you.</span>
    </div>
  );
  if (result.error) return <p className="text-red-300 text-xs">{String(result.error)}</p>;
  return (
    <div className="flex items-center gap-2 text-emerald-300 text-[12px]">
      <span className="text-base">✓</span>
      <span>{String(result.message ?? 'Order successfully cancelled.')}</span>
    </div>
  );
}

// ── Generic key-value fallback ─────────────────────────────────────────────────
function GenericResult({ result }: { result: Record<string, unknown> }) {
  return (
    <div className="space-y-0.5">
      {Object.entries(result).map(([k, v]) => (
        <Row key={k} label={k.replace(/_/g, ' ')} value={typeof v === 'object' ? JSON.stringify(v) : String(v)} />
      ))}
    </div>
  );
}

function ResultBody({ toolName, result }: { toolName: string; result: unknown }) {
  if (!result || typeof result !== 'object') {
    return <p className="text-slate-300 text-xs">{String(result)}</p>;
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

// ── Input summary line ─────────────────────────────────────────────────────────
function argSummary(toolName: string, args: Record<string, unknown>): string {
  switch (toolName) {
    case 'get_order':       return `Order #${args.orderId ?? args.order_id ?? '?'}`;
    case 'check_inventory': return `SKU: ${args.sku ?? args.productId ?? '?'}`;
    case 'lookup_policy':   return `Topic: ${args.topic ?? args.query ?? '?'}`;
    case 'cancel_order':    return `Order #${args.orderId ?? args.order_id ?? '?'}`;
    default:                return Object.values(args).join(', ');
  }
}

// ── Main component ─────────────────────────────────────────────────────────────
export function ToolCallCard({ toolCall, toolResult }: Props) {
  const [expanded, setExpanded] = useState(false);

  const meta   = TOOL_META[toolCall.name] ?? { icon: '🔧', label: toolCall.name, color: 'gray' };
  const colors = COLOR_MAP[meta.color] ?? COLOR_MAP.gray;

  const isError  = toolResult && typeof toolResult.result === 'object' && toolResult.result !== null &&
    ('error' in (toolResult.result as Record<string, unknown>) || 'denied' in (toolResult.result as Record<string, unknown>));
  const isDone   = !!toolResult;
  const isDenied = toolResult && typeof toolResult.result === 'object' && toolResult.result !== null &&
    'denied' in (toolResult.result as Record<string, unknown>);

  const statusKey = !isDone ? 'loading' : isDenied ? 'denied' : isError ? 'error' : 'done';

  return (
    <div className="my-2 rounded-2xl overflow-hidden border border-white/10 animate-fade-in" style={{ background: 'rgba(255,255,255,0.04)' }}>

      {/* ── Header row ─────────────────────────────────────────────────────── */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full px-3 py-2.5 flex items-center justify-between gap-2 hover:bg-white/5 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Icon bubble */}
          <div className={`w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 text-sm ${colors.icon}`}>
            {meta.icon}
          </div>
          {/* Label + query */}
          <div className="min-w-0">
            <p className="text-slate-200 text-[12px] font-semibold leading-tight">{meta.label}</p>
            <p className="text-slate-500 text-[10px] truncate">{argSummary(toolCall.name, toolCall.args)}</p>
          </div>
        </div>

        {/* Right: status + chevron */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {STATUS_BADGE[statusKey]}
          <svg
            className={`w-3 h-3 text-slate-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* ── Progress bar while loading ──────────────────────────────────────── */}
      {!isDone && (
        <div className="h-0.5 w-full overflow-hidden">
          <div className={`h-full ${colors.bar} animate-progress-bar`} />
        </div>
      )}

      {/* ── Expanded detail panel ───────────────────────────────────────────── */}
      {expanded && (
        <div className="border-t border-white/8 px-3 pt-2 pb-3 animate-fade-in">
          {isDone ? (
            <ResultBody toolName={toolCall.name} result={toolResult!.result} />
          ) : (
            <p className="text-slate-500 text-[11px] italic">Waiting for response…</p>
          )}
        </div>
      )}
    </div>
  );
}
