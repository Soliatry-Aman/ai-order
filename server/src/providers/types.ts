/**
 * Shared types for the provider abstraction layer.
 *
 * Every provider receives a list of ClientMessage (the app's chat history)
 * and must return an async generator that yields SseEvent objects.
 * The Express route handler writes each event straight to the SSE stream.
 */

// ── Client message shape (sent from the React frontend) ─────────────────────

export interface ClientToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface ClientToolResult {
  toolCallId: string;
  name: string;
  result: unknown;
}

export interface ClientMessage {
  id: string;
  role: "user" | "model";
  text?: string;
  toolCalls?: ClientToolCall[];
  toolResults?: ClientToolResult[];
}

// ── SSE events emitted by providers ─────────────────────────────────────────

export interface TextEvent {
  type: "text";
  text: string;
}

export interface ToolCallEvent {
  type: "tool_call";
  toolCall: {
    id: string;
    name: string;
    args: Record<string, unknown>;
  };
}

export type SseEvent = TextEvent | ToolCallEvent;

// ── Provider contract ────────────────────────────────────────────────────────

export interface Provider {
  /** Display name used in startup logs */
  name: string;
  /** Async generator that streams events for one agent turn */
  stream(messages: ClientMessage[]): AsyncGenerator<SseEvent>;
}
