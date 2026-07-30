/**
 * Gemini provider — uses @google/genai SDK.
 *
 * Features:
 * - Converts the client's flat message list into Gemini's Content[] format
 * - Auto-retries on 429 rate-limit errors using the retryDelay from the API response
 * - Falls back through a model priority list if the primary model is unavailable
 */

import { GoogleGenAI } from "@google/genai";
import type { Provider, ClientMessage, SseEvent } from "./types";
import { GEMINI_TOOLS, GEMINI_SYSTEM_PROMPT } from "./tools";

// Model priority list — tries each in order until one works
const MODEL_PRIORITY = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
];

const MAX_RETRIES = 3;

/** Parse retryDelay seconds from a 429 error message, fallback to 5s */
function parseRetryDelay(err: unknown): number {
  try {
    const msg = String((err as any)?.message ?? "");
    // Look for "retryDelay":"Xs" pattern
    const match = msg.match(/"retryDelay"\s*:\s*"?([\d.]+)s?"?/);
    if (match) return Math.ceil(parseFloat(match[1])) * 1000;
  } catch { /* ignore */ }
  return 5000; // default 5 second wait
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Returns true if the value looks like a real API key (not an unfilled placeholder) */
function isRealKey(key: string | undefined): key is string {
  if (!key) return false;
  if (/^your[_\-]/i.test(key)) return false;
  if (/placeholder|example|changeme|insert|paste/i.test(key)) return false;
  if (key.length < 10) return false;
  return true;
}

export function createGeminiProvider(): Provider {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!isRealKey(apiKey)) throw new Error("GEMINI_API_KEY is not set or is a placeholder in .env");

  const ai = new GoogleGenAI({ apiKey });

  // Use env override, or first in the priority list
  const primaryModel = process.env.AI_MODEL ?? MODEL_PRIORITY[0];

  return {
    name: `Gemini (${primaryModel})`,

    async *stream(messages: ClientMessage[]): AsyncGenerator<SseEvent> {
      // ── Convert client messages → Gemini Content[] ─────────────────────────
      const contents: any[] = [];

      for (const msg of messages) {
        if (msg.role === "user") {
          if (msg.text) {
            contents.push({ role: "user", parts: [{ text: msg.text }] });
          }
          continue;
        }

        if (msg.role === "model") {
          const modelParts: any[] = [];
          if (msg.text) modelParts.push({ text: msg.text });

          if (msg.toolCalls?.length) {
            for (const call of msg.toolCalls) {
              modelParts.push({ functionCall: { name: call.name.trim(), args: call.args } });
            }
          }

          if (modelParts.length > 0) {
            contents.push({ role: "model", parts: modelParts });
          }

          // Gemini requires tool results in a SUBSEQUENT user turn
          if (msg.toolResults?.length) {
            const resultParts = msg.toolResults.map((tr) => {
              // Gemini strictly requires `response` to be a JSON object (Struct)
              let safeResponse: object;
              if (typeof tr.result === "string") {
                try {
                  safeResponse = JSON.parse(tr.result);
                  if (typeof safeResponse !== "object" || safeResponse === null) {
                    safeResponse = { value: safeResponse };
                  }
                } catch {
                  safeResponse = { text: tr.result };
                }
              } else if (typeof tr.result === "object" && tr.result !== null) {
                safeResponse = tr.result as object;
              } else {
                safeResponse = { value: tr.result };
              }

              return {
                functionResponse: {
                  name: tr.name,
                  response: safeResponse,
                },
              };
            });
            contents.push({ role: "user", parts: resultParts });
          }
        }
      }

      // ── Try models with retry on 429 ────────────────────────────────────────
      // Build candidate list: primary model first, then fallbacks (de-duped)
      const candidates = [
        primaryModel,
        ...MODEL_PRIORITY.filter(m => m !== primaryModel),
      ];

      let lastError: unknown;

      for (const candidate of candidates) {
        let attempt = 0;

        while (attempt < MAX_RETRIES) {
          try {
            console.log(`  → Trying model: ${candidate} (attempt ${attempt + 1})`);

            const responseStream = await ai.models.generateContentStream({
              model: candidate,
              contents,
              config: {
                tools: GEMINI_TOOLS as any,
                systemInstruction: GEMINI_SYSTEM_PROMPT,
              },
            });

            for await (const chunk of responseStream) {
              if (chunk.text) {
                yield { type: "text", text: chunk.text };
              }
              if (chunk.functionCalls?.length) {
                for (const call of chunk.functionCalls) {
                  yield {
                    type: "tool_call",
                    toolCall: {
                      id: (call as any).id ?? crypto.randomUUID(),
                      name: call.name!.trim(),
                      args: (call.args ?? {}) as Record<string, unknown>,
                    },
                  };
                }
              }
            }

            // Success — we're done
            return;

          } catch (err: unknown) {
            lastError = err;
            const status = (err as any)?.status ?? (err as any)?.code;

            // On 429 (rate limit), 404 (not found), or 400 (bad request),
            // immediately skip to the next Gemini model in MODEL_PRIORITY
            console.warn(`  ⚠️  Model ${candidate} failed (${status ?? "error"}). Trying next Gemini model...`);
            break; // Try next candidate model immediately without sleeping
          }
        }
      }

      // All models exhausted
      const errMsg = lastError instanceof Error ? lastError.message : String(lastError);
      throw new Error(
        `All Gemini models exhausted. Last error: ${errMsg.slice(0, 200)}. ` +
        `Consider switching AI_PROVIDER to 'groq' in server/.env for a free alternative with higher limits.`
      );
    },
  };
}
