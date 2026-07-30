import { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message, ToolCall } from '../types';
import { ToolCallCard } from './ToolCallCard';
import { ApprovalCard } from './ApprovalCard';

interface Props {
  messages: Message[];
  isLoading: boolean;
  pendingApproval: { toolCall: ToolCall; messageId: string } | null;
  onApprove: (approved: boolean) => void;
  onSend: (text: string) => void;
  onPrefill: (text: string) => void;
  onDeleteMessage?: (id: string) => void;
}

const PROMPT_LIBRARY = [
  {
    icon: '📦',
    label: 'Track an Order',
    hint: 'Fill in your order ID then send',
    prefill: 'Where is order ',
    sendDirectly: false,
  },
  {
    icon: '🏭',
    label: 'Check Inventory',
    hint: 'Fill in product name or SKU',
    prefill: 'Check inventory for ',
    sendDirectly: false,
  },
  {
    icon: '📋',
    label: 'Return Policy',
    hint: '30-day return guidelines',
    prefill: 'What is your return policy?',
    sendDirectly: true,
  },
  {
    icon: '🚫',
    label: 'Cancel an Order',
    hint: 'Fill in order ID to cancel',
    prefill: 'I want to cancel order ',
    sendDirectly: false,
  },
];

function TypingIndicator() {
  return (
    <div className="flex justify-start animate-fade-in my-1">
      <div className="bg-slate-800/80 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-3 max-w-xs border border-white/10 shadow-lg">
        <div className="w-6 h-6 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center flex-shrink-0">
          <span className="text-xs text-indigo-300 font-bold">SD</span>
        </div>
        <div className="flex items-center gap-1.5 py-1">
          <span className="typing-dot w-2 h-2 rounded-full bg-indigo-400" />
          <span className="typing-dot w-2 h-2 rounded-full bg-indigo-400" />
          <span className="typing-dot w-2 h-2 rounded-full bg-indigo-400" />
        </div>
      </div>
    </div>
  );
}

export function ChatWindow({ messages, isLoading, pendingApproval, onApprove, onSend, onPrefill, onDeleteMessage }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, pendingApproval]);

  const visibleMessages = messages.filter(m => {
    if (m.role === 'model' && !m.text && !(m.toolCalls?.length) && !m.isStopped) return false;
    return true;
  });

  const lastVisible = visibleMessages[visibleMessages.length - 1];
  const showTypingIndicator = isLoading && (
    visibleMessages.length === 0 ||
    lastVisible?.role === 'user' ||
    (lastVisible?.role === 'model' && !lastVisible?.text && (lastVisible?.toolCalls?.length ?? 0) > 0)
  );

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-5">
      {/* Clean Minimal Hero */}
      {messages.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 py-6 animate-fade-in my-auto">
          {/* Logo Hero */}
          <div className="relative group cursor-pointer" onClick={() => onSend("What orders can I track?")}>
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform duration-200">
              <span className="text-2xl text-indigo-400 font-bold">📦</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center shadow-sm">
              <span className="text-[9px] text-slate-950 font-bold">✓</span>
            </div>
          </div>

          <div className="text-center max-w-md">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Order Support Workspace</h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Ask about any order status, check warehouse stock levels, or consult return policies.
            </p>
          </div>

          {/* Quick Query Templates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg">
            {PROMPT_LIBRARY.map((p, idx) => (
              <button
                key={idx}
                onClick={() => p.sendDirectly ? onSend(p.prefill) : onPrefill(p.prefill)}
                className="bg-white/3 border border-white/8 flex flex-col items-start gap-1 p-3 rounded-xl text-left hover:border-indigo-500/40 hover:bg-white/5 transition-all duration-200 group"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{p.icon}</span>
                    <span className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors">
                      {p.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 group-hover:text-indigo-400 transition-colors font-medium">
                    {p.sendDirectly ? 'Run →' : 'Edit ✏️'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {p.hint}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages Feed */}
      {visibleMessages.map((msg) => (
        <div
          key={msg.id}
          className={`flex gap-3 animate-fade-in ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          {/* Assistant Avatar */}
          {msg.role === 'model' && (
            <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
              <span className="text-xs text-indigo-300 font-bold">SD</span>
            </div>
          )}

          <div className={`flex flex-col gap-2 max-w-[85%] sm:max-w-[78%] min-w-0 ${msg.role === 'user' ? 'items-end ml-auto' : 'items-start'}`}>
            {/* Header label & action */}
            <div className="flex items-center gap-2 px-1 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
              {msg.role === 'user' ? (
                <div className="flex items-center gap-1.5">
                  <span>Support Agent</span>
                  <span className="w-4 h-4 rounded bg-indigo-600/30 border border-indigo-500/40 text-[9px] text-indigo-300 flex items-center justify-center font-bold">
                    AG
                  </span>
                </div>
              ) : (
                <span>ShopDesk System</span>
              )}
              
              {msg.text && (
                <button
                  onClick={() => handleCopyText(msg.id, msg.text!)}
                  className="opacity-0 hover:opacity-100 transition-opacity text-slate-400 hover:text-white ml-1"
                  title="Copy text"
                >
                  {copiedId === msg.id ? '✓ Copied' : '📋'}
                </button>
              )}

              {onDeleteMessage && (
                <button
                  onClick={() => onDeleteMessage(msg.id)}
                  className="opacity-0 hover:opacity-100 transition-opacity text-slate-500 hover:text-red-400 ml-1"
                  title="Delete message from chat"
                >
                  🗑️
                </button>
              )}
            </div>

            {/* Bubble */}
            <div className={`rounded-2xl px-4 py-3 shadow-lg transition-all ${
              msg.role === 'user'
                ? 'bg-indigo-600 text-white rounded-tr-none'
                : 'bg-slate-800/80 border border-white/10 text-slate-100 rounded-tl-none backdrop-blur-md'
            }`}>
              {/* Text content */}
              {msg.text && (
                <div className="message-prose text-xs sm:text-sm leading-relaxed">
                  {msg.role === 'user' ? (
                    <div className="whitespace-pre-wrap break-words font-medium">{msg.text.trim()}</div>
                  ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                  )}
                  {msg.role === 'model' && !msg.isStopped && isLoading && (
                    <span className="inline-block w-0.5 h-4 bg-current animate-blink ml-1 align-middle" />
                  )}
                  {msg.isStopped && (
                    <span className="ml-2 text-[10px] text-slate-400 italic">• generation stopped</span>
                  )}
                </div>
              )}

              {/* Tool call cards */}
              {msg.toolCalls?.map((call, idx) => (
                <ToolCallCard
                  key={call.id ?? idx}
                  toolCall={call}
                  toolResult={msg.toolResults?.find(r => r.toolCallId === call.id || r.name === call.name)}
                />
              ))}

              {/* Approval gate */}
              {pendingApproval?.messageId === msg.id && (
                <ApprovalCard
                  toolCall={pendingApproval.toolCall}
                  onApprove={() => onApprove(true)}
                  onDeny={() => onApprove(false)}
                />
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Live typing indicator */}
      {showTypingIndicator && <TypingIndicator />}

      <div ref={bottomRef} />
    </div>
  );
}
