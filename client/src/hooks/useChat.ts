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

  const messagesRef = useRef<Message[]>(messages);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

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

  const deleteMessage = (id: string) => {
    setMessages(prev => {
      const updated = prev.filter(m => m.id !== id);
      messagesRef.current = updated;
      return updated;
    });
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
   * If existingMessageId is provided, streams follow-up text into that SAME message slot.
   */
  const runAgentLoop = async (turnCount: number, existingMessageId?: string) => {
    if (turnCount >= MAX_TURNS) {
      const limitMsg: Message = {
        id: crypto.randomUUID(),
        role: 'model',
        text: 'I have reached the maximum number of reasoning steps. Please rephrase your request.',
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

    // Reuse existing model message slot or create a new one
    const modelMessageId = existingMessageId ?? crypto.randomUUID();

    if (!existingMessageId) {
      const modelMsg: Message = { id: modelMessageId, role: 'model', text: '', toolCalls: [], toolResults: [] };
      setMessages(prev => {
        const updated = [...prev, modelMsg];
        messagesRef.current = updated;
        return updated;
      });
    }

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
        body: JSON.stringify({ messages: messagesRef.current.filter(m => m.id !== modelMessageId || m.text || m.toolCalls?.length) }),
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
                  id: data.toolCall.id ?? crypto.randomUUID(),
                  name: data.toolCall.name,
                  args: data.toolCall.args ?? {},
                };
                collectedToolCalls.push(call);
                updateModelMsg(m => ({ ...m, toolCalls: [...(m.toolCalls ?? []), call] }));
              } else if (data.type === 'error') {
                updateModelMsg(m => ({
                  ...m,
                  text: (m.text ?? '') + `\n\n⚠️ ${data.message}`,
                }));
                readerDone = true;
              }
            } catch {
              // skip malformed SSE chunk
            }
          }
        }
      }

      // If no new tool calls were emitted in this turn, we are done
      if (collectedToolCalls.length === 0) {
        setIsLoading(false);
        return;
      }

      // Execute collected tool calls
      const toolResults: ToolResult[] = [];

      for (const call of collectedToolCalls) {
        if (call.name === 'cancel_order') {
          setPendingApproval({ toolCall: call, messageId: modelMessageId });
          setIsLoading(false);
          return;
        }

        const result = await executeTool(call.name, call.args);
        const toolResult: ToolResult = { toolCallId: call.id, name: call.name, result };
        toolResults.push(toolResult);

        updateModelMsg(m => ({
          ...m,
          toolResults: [...(m.toolResults ?? []), toolResult],
        }));
      }

      // Continue loop into the SAME message slot to receive follow-up text answer
      await runAgentLoop(turnCount + 1, modelMessageId);

    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
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

    setMessages(prev => {
      const updated = prev.map(m =>
        m.id === messageId
          ? { ...m, toolResults: [...(m.toolResults ?? []), toolResult] }
          : m
      );
      messagesRef.current = updated;
      return updated;
    });

    setTimeout(() => {
      runAgentLoop(1, messageId);
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
    deleteMessage,
    stop,
    handleApproval,
  };
}
