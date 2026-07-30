/**
 * Tool definitions in BOTH formats so each provider can pick what it needs.
 *
 * - GEMINI_TOOLS   → `functionDeclarations` format used by @google/genai
 * - OPENAI_TOOLS   → `tools` array format used by OpenAI-compatible APIs
 *                    (Groq, OpenRouter, Cerebras all use this)
 */

const SYSTEM_PROMPT =
  "You are a helpful AI Order Assistant for a customer support representative.\n\n" +
  "HOW TO USE TOOLS:\n" +
  "- Use tools ONLY to fetch data you do not yet have (order details, inventory levels, policies).\n" +
  "- Once a tool result appears in the conversation, DO NOT call that tool again — instead READ the result and write your reply.\n" +
  "- After every tool result, you MUST immediately write a clear, friendly text answer summarising what you found.\n" +
  "- Never leave the conversation with only a tool call and no text response.\n" +
  "- ONLY call tools that are explicitly listed: get_order, check_inventory, lookup_policy, cancel_order. Never call any other tool — doing so will cause a fatal error.\n\n" +
  "HANDLING SPECIFIC REQUESTS:\n" +
  "- RETURNS / REFUNDS: When a customer mentions returning, refunding, or exchanging an item, call lookup_policy with topic='returns' to fetch the policy, then explain it clearly to the customer. Do NOT attempt to call a 'return_order' or 'refund_order' tool — those do not exist.\n" +
  "- SHIPPING QUESTIONS: Call lookup_policy with topic='shipping'.\n" +
  "- CANCELLATIONS: Call lookup_policy with topic='cancellation' first to check eligibility, then offer to cancel with cancel_order if appropriate.\n\n" +
  "IMPORTANT RULES:\n" +
  "- Never invent, guess, or assume order IDs, SKUs, or policy content.\n" +
  "- Never call cancel_order unless the user explicitly stated an order ID. If they did not, ask: 'Which order ID would you like to cancel?'\n" +
  "- When cancel_order is called, the system will pause for human approval before executing.\n" +
  "- Be concise, friendly, and professional.";

// ── Shared schema fragments ──────────────────────────────────────────────────

const TOOL_DEFS = [
  {
    name: "get_order",
    description: "Fetch full details of an order by its ID, including current status and customer info.",
    params: {
      orderId: { type: "string" as const, description: "The order ID to look up" },
    },
    required: ["orderId"],
  },
  {
    name: "check_inventory",
    description: "Check the current stock level for a product. You can pass the product SKU code OR the product name — either works.",
    params: {
      sku: { type: "string" as const, description: "The product SKU code OR product name (e.g. 'SFL-SER-30' or 'vitamin c serum')" },
    },
    required: ["sku"],
  },
  {
    name: "lookup_policy",
    description: "Retrieve the brand's written policy on a given topic.",
    params: {
      topic: {
        type: "string" as const,
        description: "Policy topic",
        enum: ["returns", "shipping", "cancellation"],
      },
    },
    required: ["topic"],
  },
  {
    name: "cancel_order",
    description:
      "Cancel an order. THIS REQUIRES HUMAN APPROVAL before the cancellation is executed. " +
      "Call this tool when the customer wants to cancel; the system will pause and prompt the agent for confirmation.",
    params: {
      orderId: { type: "string" as const, description: "The order ID to cancel" },
      reason: { type: "string" as const, description: "Reason for cancellation" },
    },
    required: ["orderId", "reason"],
  },
] as const;

// ── Gemini format ────────────────────────────────────────────────────────────

export const GEMINI_TOOLS = [
  {
    functionDeclarations: TOOL_DEFS.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: {
        type: "OBJECT",
        properties: Object.fromEntries(
          Object.entries(t.params).map(([k, v]) => [
            k,
            {
              type: v.type.toUpperCase(),
              description: v.description,
              ...(("enum" in v && v.enum) ? { enum: v.enum } : {}),
            },
          ])
        ),
        required: t.required as unknown as string[],
      },
    })),
  },
];

export const GEMINI_SYSTEM_PROMPT = SYSTEM_PROMPT;

// ── OpenAI-compatible format (Groq / OpenRouter / Cerebras) ─────────────────

export const OPENAI_TOOLS = TOOL_DEFS.map((t) => ({
  type: "function" as const,
  function: {
    name: t.name,
    description: t.description,
    parameters: {
      type: "object",
      properties: Object.fromEntries(
        Object.entries(t.params).map(([k, v]) => [
          k,
          {
            type: v.type,
            description: v.description,
            ...(("enum" in v && v.enum) ? { enum: v.enum } : {}),
          },
        ])
      ),
      required: t.required as unknown as string[],
    },
  },
}));

export const OPENAI_SYSTEM_PROMPT = SYSTEM_PROMPT;
