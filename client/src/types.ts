export type MessageRole = 'user' | 'model';

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
  id: string;
}

export interface ToolResult {
  toolCallId: string;
  name: string;
  result: unknown;
}

export interface Message {
  id: string;
  role: MessageRole;
  text?: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  isStopped?: boolean;
}
