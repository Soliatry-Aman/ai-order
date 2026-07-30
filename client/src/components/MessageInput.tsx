import React, { useState, useRef, useEffect, useCallback } from 'react';

interface Props {
  onSend: (text: string) => void;
  onStop: () => void;
  isLoading: boolean;
  disabled?: boolean;
  prefillText?: string;
  onPrefillConsumed?: () => void;
}

export function MessageInput({ onSend, onStop, isLoading, disabled, prefillText, onPrefillConsumed }: Props) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (prefillText) {
      setText(prefillText);
      setTimeout(() => {
        const el = textareaRef.current;
        if (el) {
          el.focus();
          el.setSelectionRange(el.value.length, el.value.length);
        }
      }, 0);
      onPrefillConsumed?.();
    }
  }, [prefillText, onPrefillConsumed]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  const focusTextarea = useCallback(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || isLoading || disabled) return;
    onSend(trimmed);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    focusTextarea();
  }, [text, isLoading, disabled, onSend, focusTextarea]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isEnter = e.key === 'Enter' || e.keyCode === 13 || e.code === 'Enter';
    if (isEnter) {
      if (e.shiftKey) return;
      e.preventDefault();
      e.stopPropagation();
      if (!e.nativeEvent.isComposing) {
        handleSubmit();
      }
    }
  };

  const handleInsertNewline = () => {
    setText(prev => prev + '\n');
    focusTextarea();
  };

  const canSend = text.trim().length > 0 && !isLoading && !disabled;

  return (
    <div className="border-t border-white/10 p-3.5 sm:p-4 bg-slate-950/70 backdrop-blur-xl">
      <form
        onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
        className="relative flex items-end gap-2.5"
      >
        {/* Main Glass Text Input Box */}
        <div className="flex-1 relative glass rounded-2xl border border-white/12 focus-within:border-indigo-500/60 focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all duration-200 shadow-xl overflow-hidden">
          <textarea
            ref={textareaRef}
            id="message-input"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!!disabled}
            rows={1}
            placeholder={
              disabled
                ? 'Awaiting your approval above…'
                : 'Type a customer name, order #, SKU, or question...'
            }
            className="w-full resize-none px-4 py-3 bg-transparent text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ lineHeight: '1.5' }}
          />

          {/* Action Toolbar inside Input */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-black/20 border-t border-white/5 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              {text && (
                <button
                  type="button"
                  onClick={() => setText('')}
                  className="px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                  title="Clear input text"
                >
                  Clear
                </button>
              )}
            </div>

            <span className="font-mono text-[10px] text-slate-500 ml-auto">
              {text.length} chars
            </span>
          </div>
        </div>

        {/* Submit or Stop Button */}
        {isLoading ? (
          <button
            type="button"
            onClick={() => { onStop(); focusTextarea(); }}
            className="w-11 h-11 rounded-2xl bg-red-600 hover:bg-red-500 text-white flex items-center justify-center flex-shrink-0 transition-all duration-200 shadow-lg glow-red cursor-pointer"
            title="Stop generating"
            aria-label="Stop generating"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </button>
        ) : (
          <button
            type="submit"
            disabled={!canSend}
            className="w-11 h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center flex-shrink-0 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-xl cursor-pointer"
            title="Send message"
            aria-label="Send message"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        )}
      </form>

      {/* Keyboard Shortcut Hints */}
      <div className="flex items-center justify-center gap-3 text-[11px] text-slate-400 mt-2.5 select-none">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSend}
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white/4 border border-white/8 hover:bg-white/8 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
        >
          <kbd className="font-mono text-[10px] bg-slate-900 px-1.5 py-0.5 rounded border border-white/10 text-indigo-300">Enter</kbd>
          <span>Send</span>
        </button>
        <span>·</span>
        <button
          type="button"
          onClick={handleInsertNewline}
          disabled={!!disabled}
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white/4 border border-white/8 hover:bg-white/8 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
        >
          <kbd className="font-mono text-[10px] bg-slate-900 px-1.5 py-0.5 rounded border border-white/10 text-indigo-300">Shift + Enter</kbd>
          <span>New line</span>
        </button>
      </div>
    </div>
  );
}
