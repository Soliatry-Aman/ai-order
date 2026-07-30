/**
 * Tool definitions in BOTH formats so each provider can pick what it needs.
 *
 * - GEMINI_TOOLS   → `functionDeclarations` format used by @google/genai
 * - OPENAI_TOOLS   → `tools` array format used by OpenAI-compatible APIs
 */

const SYSTEM_PROMPT =
  "You are a helpful customer support workspace assistant for an e-commerce platform.\n\n" +
  "HOW TO USE TOOLS:\n" +
  "- Use tools to fetch order details, inventory levels, or store policies.\n" +
  "- When a user mentions a customer name (e.g. 'Priya Sharma') or an order ID (e.g. '4821'), IMMEDIATELY call `get_order` with orderId set to that name or ID.\n" +
  "- Once a tool result appears in the conversation, READ the result and write a clear, friendly human response.\n" +
  "- NEVER output raw code tags like `<function=...>` or `<tool_call>` in your text. Always speak in natural, friendly conversational language.\n" +
  "- ONLY call tools that are explicitly listed: get_order, check_inventory, lookup_policy, cancel_order.\n\n" +
  "HANDLING SPECIFIC REQUESTS:\n" +
  "- CUSTOMER SEARCH / ORDERS: Call get_order with orderId='Priya Sharma' or orderId='4821'.\n" +
  "- RETURNS / REFUNDS: Call lookup_policy with topic='returns'.\n" +
  "- SHIPPING: Call lookup_policy with topic='shipping'.\n" +
  "- CANCELLATIONS: Call lookup_policy with topic='cancellation' or cancel_order when order ID is stated.\n\n" +
  "IMPORTANT RULES:\n" +
  "- Speak clearly, concisely, and professionally like a human support representative.\n" +
  "- Never invent order IDs or customer names.";

const TOOL_DEFS = [
  {
    name: "get_order",
    description: "Fetch full details of an order by either its Order ID OR Customer Name (e.g. '4821' or 'Priya Sharma').",
    params: {
      orderId: { type: "string" as const, description: "The order ID or customer name to look up (e.g. '4821' or 'Priya Sharma')" },
    },
    required: ["orderId"],
  },
  {
    name: "check_inventory",
    description: "Check current stock level for a product by SKU code OR product name (e.g. 'SLV-BLK-40' or 'watch').",
    params: {
      sku: { type: "string" as const, description: "The product SKU code OR product name" },
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
      "Cancel an order. THIS REQUIRES HUMAN APPROVAL before execution.",
    params: {
      orderId: { type: "string" as const, description: "The order ID to cancel" },
      reason: { type: "string" as const, description: "Reason for cancellation" },
    },
    required: ["orderId", "reason"],
  },
] as const;

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
