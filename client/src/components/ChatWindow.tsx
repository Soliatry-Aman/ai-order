import { useRef, useEffect } from 'react';
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
  onPrefill: (text: string) => void;  // fills input without sending
}

// Generic template prompts — clicking fills the input so the user enters their own details
const SUGGESTED_PROMPTS = [
  {
    icon: '📦',
    label: 'Track an Order',
    hint: 'Fill in your order ID then send',
    prefill: 'Where is order ',
  },
  {
    icon: '📋',
    label: 'Return Policy',
    hint: 'Sends immediately',
    prefill: 'What is your return policy?',
    sendDirectly: true,
  },
  {
    icon: '🏭',
    label: 'Check Inventory',
    hint: 'Fill in a SKU or product name',
    prefill: 'Check inventory for ',
  },
  {
    icon: '🚫',
    label: 'Cancel an Order',
    hint: 'Fill in the order ID to cancel',
    prefill: 'I want to cancel order ',   // deliberately incomplete — user MUST type the ID
  },
];

function TypingIndicator() {
  return (
    <div className="flex justify-start animate-fade-in">
      <div className="glass rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2 max-w-xs">
        <div className="flex items-center gap-1 py-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 mr-1">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="typing-dot w-2 h-2 rounded-full bg-indigo-400" />
          <span className="typing-dot w-2 h-2 rounded-full bg-indigo-400" />
          <span className="typing-dot w-2 h-2 rounded-full bg-indigo-400" />
        </div>
      </div>
    </div>
  );
}

export function ChatWindow({ messages, isLoading, pendingApproval, onApprove, onSend, onPrefill }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, pendingApproval]);

  // Check if the last message is an empty model message placeholder (streaming not started yet)
  const visibleMessages = messages.filter(m => {
    if (m.role === 'model' && !m.text && !(m.toolCalls?.length) && !m.isStopped) return false;
    return true;
  });

  const lastVisible = visibleMessages[visibleMessages.length - 1];
  const showTypingIndicator = isLoading && (
    visibleMessages.length === 0 ||
    lastVisible?.role === 'user' ||
    // After a tool card: model message has tool calls but no text yet → AI is writing the follow-up reply
    (lastVisible?.role === 'model' && !lastVisible?.text && (lastVisible?.toolCalls?.length ?? 0) > 0)
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
      {/* Empty state */}
      {messages.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 py-8 animate-fade-in">
          {/* Logo mark */}
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl glow-blue">
              <span className="text-4xl">📦</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
              <span className="text-[10px]">✓</span>
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-100">AI Order Assistant</h2>
            <p className="text-sm text-slate-400 mt-1">Ask me anything about orders, inventory, or policies.</p>
          </div>

          {/* Suggested prompt tiles */}
          <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
            {SUGGESTED_PROMPTS.map((p) => (
              <button
                key={p.label}
                onClick={() => p.sendDirectly ? onSend(p.prefill) : onPrefill(p.prefill)}
                className="glass flex flex-col items-start gap-1 px-3 py-2.5 rounded-xl text-left hover:bg-white/8 transition-all duration-200 hover:border-white/20 group"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-base flex-shrink-0">{p.icon}</span>
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors">{p.label}</span>
                </div>
                <span className="text-[10px] text-slate-500 pl-0.5">
                  {p.sendDirectly ? '↵ sends immediately' : `✏️ ${p.hint}`}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      {visibleMessages.map((msg) => (
        <div
          key={msg.id}
          className={`flex gap-3 animate-fade-in ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          {/* AI Avatar */}
          {msg.role === 'model' && (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-lg">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          <div className={`flex flex-col gap-1 max-w-[80%] min-w-0 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            {/* Role label */}
            <span className="text-[10px] uppercase tracking-wider text-slate-500 px-1">
              {msg.role === 'user' ? 'You' : 'Assistant'}
            </span>

            {/* Bubble */}
            <div className={`rounded-2xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-tr-none shadow-lg glow-blue'
                : 'glass text-slate-100 rounded-tl-none'
            }`}>
              {/* Text content */}
              {msg.text && (
                <div className="message-prose text-sm leading-relaxed">
                  {msg.role === 'user' ? (
                    // Plain text for user messages trimmed cleanly — no extra lines or p-tag margins
                    <div className="whitespace-pre-wrap break-words">{msg.text.trim()}</div>
                  ) : (
                    // Rich markdown only for AI responses
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                  )}
                  {/* Blinking cursor — only on AI messages while streaming */}
                  {msg.role === 'model' && !msg.isStopped && isLoading && (
                    <span className="inline-block w-0.5 h-4 bg-current animate-blink ml-0.5 align-middle" />
                  )}
                  {/* Stopped indicator */}
                  {msg.isStopped && (
                    <span className="ml-2 text-[10px] text-slate-400 italic">• stopped</span>
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

              {/* Approval gate (rendered inline in model bubble) */}
              {pendingApproval?.messageId === msg.id && (
                <ApprovalCard
                  toolCall={pendingApproval.toolCall}
                  onApprove={() => onApprove(true)}
                  onDeny={() => onApprove(false)}
                />
              )}
            </div>
          </div>

          {/* User avatar */}
          {msg.role === 'user' && (
            <div className="w-8 h-8 rounded-full bg-slate-700 border border-white/10 flex items-center justify-center flex-shrink-0 mt-1 text-sm">
              👤
            </div>
          )}
        </div>
      ))}

      {/* Live typing indicator */}
      {showTypingIndicator && <TypingIndicator />}

      <div ref={bottomRef} />
    </div>
  );
}
