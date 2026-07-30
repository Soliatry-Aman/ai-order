import React, { useState, useRef, useEffect, useCallback } from 'react';

interface Props {
  onSend: (text: string) => void;
  onStop: () => void;
  isLoading: boolean;
  disabled?: boolean;
  prefillText?: string;     // fills the input without sending (for prompt templates)
  onPrefillConsumed?: () => void; // signals parent that prefill was applied
}

export function MessageInput({ onSend, onStop, isLoading, disabled, prefillText, onPrefillConsumed }: Props) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // When a suggested prompt template is clicked, fill the textarea and focus it
  useEffect(() => {
    if (prefillText) {
      setText(prefillText);
      // Focus and move cursor to end so user types right after the template
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

  // Auto-grow textarea height based on content
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
    // Check for Enter key across all browser/OS variations
    const isEnter = e.key === 'Enter' || e.keyCode === 13 || e.code === 'Enter';

    if (isEnter) {
      if (e.shiftKey) {
        // Shift + Enter -> allow default behavior (insert newline)
        return;
      }

      // Plain Enter -> ALWAYS prevent default newline insertion
      e.preventDefault();
      e.stopPropagation();

      // Only submit if not composing (IME)
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
    <div className="border-t border-white/8 p-4 bg-slate-900/50 backdrop-blur-sm">
      <form
        onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
        className="relative flex items-end gap-2"
      >
        <div className="flex-1 relative">
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
                : 'Ask about an order… (Enter to send, Shift+Enter for new line)'
            }
            className="w-full resize-none rounded-2xl px-4 py-3 bg-white/5 border border-white/10 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ lineHeight: '1.5' }}
          />
        </div>

        {isLoading ? (
          <button
            type="button"
            onClick={() => { onStop(); focusTextarea(); }}
            className="w-10 h-10 rounded-xl bg-red-600 hover:bg-red-500 text-white flex items-center justify-center flex-shrink-0 transition-all duration-200 shadow-lg glow-red cursor-pointer"
            title="Stop generating"
            aria-label="Stop generating"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
          </button>
        ) : (
          <button
            type="submit"
            disabled={!canSend}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center flex-shrink-0 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-lg hover:from-indigo-500 hover:to-purple-500 glow-blue cursor-pointer"
            title="Send message"
            aria-label="Send message"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        )}
      </form>

      {/* Clickable keyboard shortcut badges */}
      <div className="flex items-center justify-center gap-3 text-[11px] text-slate-400 mt-2 select-none">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSend}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title="Click or press Enter to send"
        >
          <kbd className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded border border-white/10 text-indigo-300">Enter</kbd>
          <span>Send</span>
        </button>
        <span>·</span>
        <button
          type="button"
          onClick={handleInsertNewline}
          disabled={!!disabled}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title="Click or press Shift+Enter to insert new line"
        >
          <kbd className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded border border-white/10 text-indigo-300">Shift + Enter</kbd>
          <span>New line</span>
        </button>
      </div>
    </div>
  );
}
