/**
 * Provider factory / registry — with automatic cross-provider fallback.
 *
 * How it works:
 *   1. The primary provider is whichever AI_PROVIDER is set to in .env (default: groq).
 *   2. Any other provider whose API key is also set becomes a fallback.
 *   3. If the primary fails (quota, bad key, rate limit), the next available
 *      provider is tried automatically — and so on until one succeeds.
 *
 * Supported providers: gemini | groq | openrouter | cerebras
 */

import type { Provider } from "./types";
import { createGeminiProvider } from "./gemini";
import {
  createGroqProvider,
  createOpenRouterProvider,
  createCerebrasProvider,
} from "./openai-compatible";
import { createFallbackProvider } from "./fallback";

export type ProviderName = "gemini" | "groq" | "openrouter" | "cerebras";

/** All supported providers, keyed by name */
const ALL_PROVIDERS: Record<ProviderName, () => Provider> = {
  gemini: createGeminiProvider,
  groq: createGroqProvider,
  openrouter: createOpenRouterProvider,
  cerebras: createCerebrasProvider,
};

/** Default fallback order when the primary provider is exhausted */
const DEFAULT_ORDER: ProviderName[] = ["groq", "gemini", "openrouter", "cerebras"];

export function createProvider(): Provider {
  const primary = (
    (process.env.AI_PROVIDER ?? "groq").toLowerCase()
  ) as ProviderName;

  if (!ALL_PROVIDERS[primary]) {
    const valid = Object.keys(ALL_PROVIDERS).join(", ");
    throw new Error(`Unknown AI_PROVIDER "${primary}". Valid options: ${valid}`);
  }

  // Build the ordered candidate list:
  //   primary first, then remaining providers in default order (de-duped)
  const order: ProviderName[] = [
    primary,
    ...DEFAULT_ORDER.filter((p) => p !== primary),
  ];

  console.log(`\n🔗  Building provider fallback chain:`);
  console.log(`   Primary: ${primary}`);
  console.log(`   Fallback order: ${order.join(" → ")}\n`);

  const candidates = order.map((name) => ({
    name,
    factory: ALL_PROVIDERS[name],
  }));

  const provider = createFallbackProvider(candidates);

  console.log(`\n✅  Active chain: ${provider.name}\n`);
  return provider;
}

export type { Provider };
