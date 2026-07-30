/**
 * OpenAI-compatible provider — supports Groq, OpenRouter, and Cerebras.
 *
 * All three use OpenAI's chat completions API format with streaming.
 * Tool calls arrive fragmented across chunks and must be assembled before emitting.
 *
 * Key differences vs Gemini:
 *  - Tool calls use role: "tool" (not functionResponse in a user turn)
 *  - Tool call arguments arrive as a JSON string (not an object)
 *  - Arguments may be split across multiple delta chunks
 */

import OpenAI from "openai";
import type { Provider, ClientMessage, SseEvent } from "./types";
import { OPENAI_TOOLS, OPENAI_SYSTEM_PROMPT } from "./tools";

interface OpenAICompatConfig {
  providerName: string;
  apiKey: string;
  baseURL: string;
  defaultModel: string;
  /** Optional extra headers (e.g. OpenRouter requires HTTP-Referer) */
  extraHeaders?: Record<string, string>;
}

/** Returns true if the value looks like a real API key (not an unfilled placeholder) */
function isRealKey(key: string | undefined): key is string {
  if (!key) return false;
  // Common placeholder patterns left by users who haven't filled in the key
  if (/^your[_\-]/i.test(key)) return false;
  if (/placeholder|example|changeme|insert|paste/i.test(key)) return false;
  if (key.length < 10) return false;
  return true;
}


function buildOpenAICompatProvider(cfg: OpenAICompatConfig): Provider {
  const client = new OpenAI({
    apiKey: cfg.apiKey,
    baseURL: cfg.baseURL,
    defaultHeaders: cfg.extraHeaders,
  });

  const model = process.env.AI_MODEL ?? cfg.defaultModel;

  return {
    name: `${cfg.providerName} (${model})`,

    async *stream(messages: ClientMessage[]): AsyncGenerator<SseEvent> {
      // ── Convert client messages → OpenAI message format ──────────────────
      const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: "system", content: OPENAI_SYSTEM_PROMPT },
      ];

      for (const msg of messages) {
        if (msg.role === "user") {
          if (msg.text) {
            openaiMessages.push({ role: "user", content: msg.text });
          }
          continue;
        }

        if (msg.role === "model") {
          // Model assistant message (may include tool_calls)
          const assistantMsg: OpenAI.Chat.ChatCompletionAssistantMessageParam = {
            role: "assistant",
            // IMPORTANT: must be null (not empty string) when the assistant only made tool calls.
            // OpenAI spec: content is null when tool_calls are present and no text was generated.
            content: msg.text || null,
          };

          if (msg.toolCalls?.length) {
            assistantMsg.tool_calls = msg.toolCalls.map((call) => ({
              id: call.id,
              type: "function" as const,
              function: {
                name: call.name,
                arguments: JSON.stringify(call.args),
              },
            }));
          }

          openaiMessages.push(assistantMsg);

          // Each tool result goes in its own "tool" role message
          if (msg.toolResults?.length) {
            for (const tr of msg.toolResults) {
              openaiMessages.push({
                role: "tool",
                tool_call_id: tr.toolCallId,
                content: JSON.stringify(tr.result),
              });
            }
          }
        }
      }

      // ── Stream from OpenAI-compatible API ────────────────────────────────
      /**
       * Helper: run one streaming request and yield its events.
       * Returns true if generation succeeded, false if we hit a failed_generation.
       */
      async function* runStream(toolChoice: "auto" | "none"): AsyncGenerator<SseEvent, boolean> {
        const stream = await client.chat.completions.create({
          model,
          messages: openaiMessages,
          tools: OPENAI_TOOLS,
          tool_choice: toolChoice,
          stream: true,
        });

        const pendingCalls: Map<
          number,
          { id: string; name: string; argsRaw: string }
        > = new Map();

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta;
          const finishReason = chunk.choices[0]?.finish_reason;

          // ── Groq failed to generate a valid tool call ──────────────────
          // Return false so the caller can retry with tool_choice="none"
          // Note: "failed_generation" is Groq-specific and not in the OpenAI SDK union type
          if ((finishReason as string) === "failed_generation") {
            return false;
          }

          if (!delta) continue;

          // Text
          if (delta.content) {
            yield { type: "text", text: delta.content };
          }

          // Tool call deltas – accumulate
          if (delta.tool_calls) {
            for (const tc of delta.tool_calls) {
              const idx = tc.index;
              if (!pendingCalls.has(idx)) {
                pendingCalls.set(idx, { id: tc.id ?? "", name: "", argsRaw: "" });
              }
              const pending = pendingCalls.get(idx)!;
              if (tc.id) pending.id = tc.id;
              if (tc.function?.name) pending.name = tc.function.name;
              if (tc.function?.arguments) pending.argsRaw += tc.function.arguments;
            }
          }

          // When the model finishes the tool-call sequence, emit all collected calls
          if (finishReason === "tool_calls" || finishReason === "stop") {
            for (const [, pending] of pendingCalls) {
              let args: Record<string, unknown> = {};
              try {
                args = JSON.parse(pending.argsRaw || "{}");
              } catch {
                args = { _raw: pending.argsRaw };
              }
              yield {
                type: "tool_call",
                toolCall: { id: pending.id, name: pending.name, args },
              };
            }
            pendingCalls.clear();
          }
        }

        // Safety flush if stream ended without explicit finish_reason
        if (pendingCalls.size > 0) {
          for (const [, pending] of pendingCalls) {
            let args: Record<string, unknown> = {};
            try { args = JSON.parse(pending.argsRaw || "{}"); } catch { /* */ }
            yield { type: "tool_call", toolCall: { id: pending.id, name: pending.name, args } };
          }
        }

        return true;
      }

      // First attempt: normal auto tool use
      let succeeded = true;
      for await (const event of runStream("auto")) {
        if (typeof event === "boolean") { succeeded = event; break; }
        yield event;
      }

      // If tool generation failed, retry with no tools so the model answers in plain text
      if (!succeeded) {
        console.warn("  ⚠️  failed_generation detected — retrying with tool_choice=none for plain-text fallback");
        for await (const event of runStream("none")) {
          if (typeof event !== "boolean") yield event;
        }
      }
    },
  };
}

// ── Named factory functions for each provider ────────────────────────────────

export function createGroqProvider(): Provider {
  const apiKey = process.env.GROQ_API_KEY;
  if (!isRealKey(apiKey)) throw new Error("GROQ_API_KEY is not set or is a placeholder in .env");
  return buildOpenAICompatProvider({
    providerName: "Groq",
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.3-70b-versatile",
  });
}

export function createOpenRouterProvider(): Provider {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!isRealKey(apiKey)) throw new Error("OPENROUTER_API_KEY is not set or is a placeholder in .env");
  return buildOpenAICompatProvider({
    providerName: "OpenRouter",
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    defaultModel: "google/gemini-2.5-flash",
    extraHeaders: {
      "HTTP-Referer": "http://localhost:3001",
      "X-Title": "AI Order Assistant",
    },
  });
}

export function createCerebrasProvider(): Provider {
  const apiKey = process.env.CEREBRAS_API_KEY;
  if (!isRealKey(apiKey)) throw new Error("CEREBRAS_API_KEY is not set or is a placeholder in .env");
  return buildOpenAICompatProvider({
    providerName: "Cerebras",
    apiKey,
    baseURL: "https://api.cerebras.ai/v1",
    defaultModel: "llama-3.3-70b",
  });
}
