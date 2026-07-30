/**
 * Cross-provider fallback chain.
 *
 * Tries each configured provider in order. If a provider fails with a
 * retriable error (rate limit, quota exceeded, bad key, model not found),
 * it automatically moves to the next available provider.
 *
 * Only providers whose API key is present in .env are included in the chain.
 *
 * Fallback order (can be overridden by AI_PROVIDER):
 *   1. AI_PROVIDER (whatever the user set — tried first)
 *   2. Remaining providers that have a key set, in default order
 */

import type { Provider, ClientMessage, SseEvent } from "./types";

/** Errors on which we move to the next provider instead of failing hard */
const FALLBACK_STATUSES = new Set([
  400,       // bad request / tool validation failed
  401, 403,  // bad key / unauthorized
  402,       // insufficient credits (OpenRouter)
  404,       // model not found
  429,       // rate limited / quota
  500,       // internal server error from provider
  503,       // service unavailable
]);

function isFallbackError(err: unknown): boolean {
  const status = (err as any)?.status ?? (err as any)?.code ?? (err as any)?.statusCode;
  if (FALLBACK_STATUSES.has(Number(status))) return true;

  // Some SDKs wrap the status inside the message as a string
  const msg = String((err as any)?.message ?? "");
  if (/rate.?limit|quota|429|exceeded/i.test(msg)) return true;
  if (/invalid.?api.?key|unauthorized|401|403/i.test(msg)) return true;
  if (/not.?found|404/i.test(msg)) return true;
  if (/insufficient.?credit|more credit|fewer.?max_token|afford|402/i.test(msg)) return true;
  if (/failed_generation|failed to call a function|tool call validation failed|tool_choice/i.test(msg)) return true;
  if (/internal.?server.?error|500|overloaded/i.test(msg)) return true;

  return false;
}

/**
 * Creates a cascading provider that wraps `providers` and tries each in order.
 *
 * @param providers - Ordered list of (name, factory) pairs. Only providers
 *                    whose factory succeeds (key is set) are added to the chain.
 */
export function createFallbackProvider(
  candidates: Array<{ name: string; factory: () => Provider }>
): Provider {
  // Build the live chain — skip providers whose key is missing
  const chain: Provider[] = [];
  for (const { name, factory } of candidates) {
    try {
      chain.push(factory());
      console.log(`   ✅  ${name} — ready`);
    } catch {
      console.log(`   ⏭️   ${name} — skipped (no API key)`);
    }
  }

  if (chain.length === 0) {
    throw new Error(
      "No AI providers are configured. " +
      "Set at least one API key (GEMINI_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY, or CEREBRAS_API_KEY) in server/.env"
    );
  }

  const chainNames = chain.map((p) => p.name).join(" → ");

  return {
    name: chainNames,

    async *stream(messages: ClientMessage[]): AsyncGenerator<SseEvent> {
      let lastError: unknown;

      for (const provider of chain) {
        try {
          console.log(`\n  🔄  Trying provider: ${provider.name}`);
          yield* provider.stream(messages);
          // Success — stop here
          return;
        } catch (err: unknown) {
          lastError = err;

          if (isFallbackError(err)) {
            const status = (err as any)?.status ?? (err as any)?.statusCode ?? "?";
            console.warn(
              `  ⚠️  Provider "${provider.name}" failed (${status}). Falling back to next provider...`
            );
            continue; // try next provider — silently, no user-visible message
          }

          // Non-retriable error (network, parsing, etc.) — fail immediately
          throw err;
        }
      }

      // All providers exhausted
      const errMsg =
        lastError instanceof Error ? lastError.message : String(lastError);
      throw new Error(
        `All providers failed. Last error: ${errMsg.slice(0, 300)}`
      );
    },
  };
}
