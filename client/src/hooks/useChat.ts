import { useState, useRef, useEffect } from 'react';
import type { Message, ToolCall, ToolResult } from '../types';
import { executeTool } from '../utils/tools';

const MAX_TURNS = 5;
const API_BASE = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const API_URL = API_BASE ? `${API_BASE}/api/chat` : "/api/chat";

export function useChat() {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('chat_messages');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [pendingApproval, setPendingApproval] = useState<{
    toolCall: ToolCall;
    messageId: string;
  } | null>(null);

  // KEY FIX: Keep a ref that always has the latest messages
  // so async callbacks in the loop never read stale closure values
  const messagesRef = useRef<Message[]>(messages);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Keep messagesRef in sync with state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('chat_messages', JSON.stringify(messages));
  }, [messages]);

  const clearChat = () => {
    setMessages([]);
    messagesRef.current = [];
    setPendingApproval(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  };

  const stop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setMessages(prev => {
      const updated = prev.map((m, i) =>
        i === prev.length - 1 && m.role === 'model' ? { ...m, isStopped: true } : m
      );
      messagesRef.current = updated;
      return updated;
    });
  };

  /**
   * Runs one turn of the agentic loop.
   * Uses messagesRef.current for always-fresh state.
   */
  const runAgentLoop = async (turnCount: number) => {
    if (turnCount >= MAX_TURNS) {
      const limitMsg: Message = {
        id: crypto.randomUUID(),
        role: 'model',
        text: 'I have reached the maximum number of reasoning steps. Please start a new conversation or rephrase your request.',
      };
      setMessages(prev => {
        const updated = [...prev, limitMsg];
        messagesRef.current = updated;
        return updated;
      });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Create the model message slot upfront
    const modelMessageId = crypto.randomUUID();
    const modelMsg: Message = { id: modelMessageId, role: 'model', text: '', toolCalls: [], toolResults: [] };

    setMessages(prev => {
      const updated = [...prev, modelMsg];
      messagesRef.current = updated;
      return updated;
    });

    const updateModelMsg = (updater: (msg: Message) => Message) => {
      setMessages(prev => {
        const updated = prev.map(m => m.id === modelMessageId ? updater({ ...m }) : m);
        messagesRef.current = updated;
        return updated;
      });
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Send the messages as they are right now (excluding the placeholder we just added)
        body: JSON.stringify({ messages: messagesRef.current.filter(m => m.id !== modelMessageId) }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }
      if (!response.body) {
        throw new Error('No response body from backend');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = '';
      let readerDone = false;

      // Tool calls collected during this stream turn
      const collectedToolCalls: ToolCall[] = [];

      while (!readerDone) {
        const { value, done } = await reader.read();
        readerDone = done;

        if (value) {
          sseBuffer += decoder.decode(value, { stream: true });
          const events = sseBuffer.split('\n\n');
          sseBuffer = events.pop() ?? '';

          for (const event of events) {
            if (!event.startsWith('data: ')) continue;
            const raw = event.slice(6).trim();
            if (raw === '[DONE]') { readerDone = true; break; }

            try {
              const data = JSON.parse(raw);

              if (data.type === 'text' && data.text) {
                updateModelMsg(m => ({ ...m, text: (m.text ?? '') + data.text }));
              } else if (data.type === 'tool_call' && data.toolCall) {
                const call: ToolCall = {
                  // Use server-provided id (important for OpenAI-compatible providers)
                  id: data.toolCall.id ?? crypto.randomUUID(),
                  name: data.toolCall.name,
                  args: data.toolCall.args ?? {},
                };
                collectedToolCalls.push(call);
                updateModelMsg(m => ({ ...m, toolCalls: [...(m.toolCalls ?? []), call] }));
              } else if (data.type === 'error') {
                // Provider sent a structured error (e.g. rate limit, bad key)
                updateModelMsg(m => ({
                  ...m,
                  text: (m.text ?? '') + `\n\n⚠️ Provider error: ${data.message}`,
                }));
                readerDone = true;
              }
            } catch {
              // malformed SSE chunk – skip
            }
          }
        }
      }

      // ── Stream finished. Now execute all collected tool calls ─────────────────
      if (collectedToolCalls.length === 0) {
        // No tool calls → final response. We're done.
        setIsLoading(false);
        return;
      }

      const toolResults: ToolResult[] = [];

      for (const call of collectedToolCalls) {
        // cancel_order requires human approval → PAUSE
        if (call.name === 'cancel_order') {
          setPendingApproval({ toolCall: call, messageId: modelMessageId });
          setIsLoading(false);
          return; // Execution resumes via handleApproval
        }

        // Execute non-destructive tools automatically
        const result = await executeTool(call.name, call.args);
        const toolResult: ToolResult = { toolCallId: call.id, name: call.name, result };
        toolResults.push(toolResult);

        updateModelMsg(m => ({
          ...m,
          toolResults: [...(m.toolResults ?? []), toolResult],
        }));
      }

      // All tools done, loop again with updated context
      await runAgentLoop(turnCount + 1);

    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Stop was clicked – already handled in stop()
        return;
      }
      console.error('Agent loop error:', err);
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      updateModelMsg(m => ({
        ...m,
        text: (m.text ?? '') + `\n\n⚠️ Error: ${errMsg}`,
      }));
      setIsLoading(false);
    }
  };

  /**
   * Called when the user approves or denies cancel_order.
   */
  const handleApproval = async (approved: boolean) => {
    if (!pendingApproval) return;
    const { toolCall, messageId } = pendingApproval;
    setPendingApproval(null);
    setIsLoading(true);

    const result = approved
      ? await executeTool(toolCall.name, toolCall.args)
      : { denied: true, message: 'Action was denied by the human agent.' };

    const toolResult: ToolResult = {
      toolCallId: toolCall.id,
      name: toolCall.name,
      result,
    };

    // Attach the result to the model message that triggered the approval
    setMessages(prev => {
      const updated = prev.map(m =>
        m.id === messageId
          ? { ...m, toolResults: [...(m.toolResults ?? []), toolResult] }
          : m
      );
      messagesRef.current = updated;
      return updated;
    });

    // Give React a tick to flush, then continue the loop
    setTimeout(() => {
      runAgentLoop(0);
    }, 0);
  };

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading || pendingApproval) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', text: trimmed };
    setMessages(prev => {
      const updated = [...prev, userMsg];
      messagesRef.current = updated;
      return updated;
    });
    // Use setTimeout to ensure state has flushed before starting loop
    setTimeout(() => {
      runAgentLoop(0);
    }, 0);
  };

  return {
    messages,
    isLoading,
    pendingApproval,
    sendMessage,
    clearChat,
    stop,
    handleApproval,
  };
}
