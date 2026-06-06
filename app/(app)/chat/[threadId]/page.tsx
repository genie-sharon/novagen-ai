"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { createClient } from "@/lib/supabase/client";
import MessageBubble from "@/components/MessageBubble";
import ChatInput from "@/components/ChatInput";
import type { Document } from "@/lib/types";
import { FileText } from "lucide-react";
import toast from "react-hot-toast";

function SkeletonBubble({ isUser }: { isUser: boolean }) {
  return (
    <div
      className={`flex animate-pulse gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {!isUser && <div className="mt-1 h-8 w-8 shrink-0 rounded-full bg-pink-200" />}
      <div
        className={`h-14 rounded-2xl bg-pink-100/60 ${
          isUser ? "rounded-br-sm" : "rounded-bl-sm"
        } ${isUser ? "w-48" : "w-72"}`}
      />
    </div>
  );
}

function ThinkingDots() {
  return (
    <div className="flex animate-fade-up items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-pink-600 text-sm font-bold text-white shadow-sm">
        N
      </div>
      <div className="rounded-2xl rounded-bl-sm bg-[#FFF0F5] px-4 py-3 text-sm text-[#2A1F24]">
        <span>NovaGen is thinking…</span>
      </div>
    </div>
  );
}

export default function ThreadPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const threadId = params.threadId as string;
  const hasSubmitted = useRef(false);

  const [ready, setReady] = useState(false);
  const [input, setInput] = useState("");
  const [documents, setDocuments] = useState<Document[]>([]);

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    error: chatError,
  } = useChat({
    id: threadId,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { threadId },
    }),
  });

  useEffect(() => {
    (async () => {
      const { data: thread } = await supabase
        .from("threads")
        .select("user_id")
        .eq("id", threadId)
        .single();

      if (!thread) {
        router.replace("/chat");
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || thread.user_id !== user.id) {
        router.replace("/chat");
        return;
      }

      const { data: msgData } = await supabase
        .from("messages")
        .select("*")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });

      if (msgData?.length) {
        const initialMessages: UIMessage[] = msgData.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          parts: [{ type: "text" as const, text: m.content }],
          createdAt: new Date(m.created_at),
        }));
        setMessages(initialMessages);
      }

      const { data: docData } = await supabase
        .from("documents")
        .select(`*, document_chunks(count)`)
        .eq("thread_id", threadId)
        .order("created_at", { ascending: false });

      const docs: Document[] = (docData || []).map(
        (doc: Record<string, unknown>) => ({
          ...doc,
          chunk_count: (doc.document_chunks as { count: number }[])?.[0]
            ?.count ?? 0,
        })
      ) as Document[];

      setDocuments(docs);
      setReady(true);
    })();
  }, [threadId, supabase, router, setMessages]);

  useEffect(() => {
    if (!ready || hasSubmitted.current) return;

    const prompt = searchParams.get("prompt");
    if (prompt) {
      hasSubmitted.current = true;
      sendMessage({ text: prompt });
    }
  }, [ready, searchParams, sendMessage]);

  const handleSubmit = (text: string) => {
    if (!text.trim()) return;
    sendMessage({ text });
    setInput("");
  };

  useEffect(() => {
    if (chatError) {
      const msg =
        chatError instanceof Error
          ? chatError.message
          : "Failed to send message";
      toast.error(msg);
    }
  }, [chatError]);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight;
    shouldAutoScrollRef.current = distanceFromBottom < 120;
  }, []);

  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages, status]);

  const handleAttachmentReady = (doc: {
    id: string;
    name: string;
    chunkCount?: number;
  }) => {
    setDocuments((prev) => [
      {
        id: doc.id,
        user_id: "",
        thread_id: threadId,
        name: doc.name,
        size: null,
        type: null,
        storage_path: "",
        created_at: new Date().toISOString(),
        chunk_count: doc.chunkCount ?? 0,
      } as Document,
      ...prev,
    ]);
  };

  const isLoading = status === "streaming" || status === "submitted";

  if (!ready) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-6">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          <SkeletonBubble isUser />
          <SkeletonBubble isUser={false} />
          <SkeletonBubble isUser />
          <SkeletonBubble isUser={false} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6"
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          {documents.length > 0 && (
            <div className="animate-fade-up self-center rounded-full bg-pink-100 px-4 py-1.5 text-xs text-pink-600">
              RAG mode active — answers are grounded in your documents
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {isLoading &&
            messages[messages.length - 1]?.role !== "assistant" && (
              <ThinkingDots />
            )}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="sticky bottom-0 shrink-0 border-t border-pink-100 bg-[#FFF8FA] px-4 py-4">
        <div className="mx-auto max-w-4xl">
          {documents.length > 0 && (
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-pink-50 px-3 py-1 text-xs font-medium text-[#DB2777]">
              <FileText className="h-3.5 w-3.5" />
              Using {documents.length} indexed document
              {documents.length === 1 ? "" : "s"}
            </div>
          )}

          <ChatInput
            input={input}
            onInputChange={setInput}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            threadId={threadId}
            onAttachmentReady={handleAttachmentReady}
          />
        </div>
      </div>
    </div>
  );
}
