export type Thread = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  document_count?: number;
};

export type Message = {
  id: string;
  thread_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export type Document = {
  id: string;
  user_id: string;
  thread_id: string;
  name: string;
  size: number | null;
  type: string | null;
  storage_path: string;
  created_at: string;
  chunk_count?: number;
};

export type DocumentChunk = {
  id: string;
  document_id: string;
  thread_id: string;
  content: string;
  chunk_index: number | null;
  created_at: string;
};

import type { UIMessage } from "ai";

export function getMessageText(msg: UIMessage): string {
  return msg.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}
