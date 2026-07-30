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

class FailedGenerationError extends Error {}

interface OpenAICompatConfig {
  providerName: string;
  apiKey: string;
  baseURL: string;
  defaultModel: string;
  extraHeaders?: Record<string, string>;
}

function isRealKey(key: string | undefined): key is string {
  if (!key) return false;
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
          const assistantMsg: OpenAI.Chat.ChatCompletionAssistantMessageParam = {
            role: "assistant",
            content: msg.text || null,
          };

          if (msg.toolCalls?.length) {
            assistantMsg.tool_calls = msg.toolCalls.map((call) => ({
              id: call.id,
              type: "function" as const,
              function: {
                name: call.name.trim(),
                arguments: JSON.stringify(call.args),
              },
            }));
          }

          openaiMessages.push(assistantMsg);

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

      async function* runStream(toolChoice: "auto" | "none"): AsyncGenerator<SseEvent> {
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

          if ((finishReason as string) === "failed_generation") {
            throw new FailedGenerationError("Groq failed_generation");
          }

          if (!delta) continue;

          if (delta.content) {
            if (/failed_generation|failed to call a function/i.test(delta.content)) {
              throw new FailedGenerationError("Groq failed_generation error output");
            }
            yield { type: "text", text: delta.content };
          }

          if (delta.tool_calls) {
            for (const tc of delta.tool_calls) {
              const idx = tc.index;
              if (!pendingCalls.has(idx)) {
                pendingCalls.set(idx, { id: tc.id ?? "", name: "", argsRaw: "" });
              }
              const pending = pendingCalls.get(idx)!;
              if (tc.id) pending.id = tc.id;
              if (tc.function?.name) pending.name = tc.function.name.trim();
              if (tc.function?.arguments) pending.argsRaw += tc.function.arguments;
            }
          }

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

        if (pendingCalls.size > 0) {
          for (const [, pending] of pendingCalls) {
            let args: Record<string, unknown> = {};
            try { args = JSON.parse(pending.argsRaw || "{}"); } catch { /* */ }
            yield { type: "tool_call", toolCall: { id: pending.id, name: pending.name, args } };
          }
        }
      }

      try {
        for await (const event of runStream("auto")) {
          yield event;
        }
      } catch (err) {
        if (err instanceof FailedGenerationError) {
          console.warn("  ⚠️  failed_generation detected — rethrowing to trigger provider fallback");
        }
        throw err;
      }
    },
  };
}

export function createGroqProvider(): Provider {
  const apiKey = process.env.GROQ_API_KEY;
  if (!isRealKey(apiKey)) throw new Error("GROQ_API_KEY is not set or is a placeholder in .env");
  return buildOpenAICompatProvider({
    providerName: "Groq",
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.1-8b-instant",
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
    defaultModel: "llama3.3-70b",
  });
}
