import { invoke } from "@tauri-apps/api/core";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatResponse {
  content: string;
}

export async function aiChat(messages: ChatMessage[]): Promise<string> {
  const res = await invoke<ChatResponse>("ai_chat", { messages });
  return res.content;
}
