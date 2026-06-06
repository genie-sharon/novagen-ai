"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Thread } from "@/lib/types";
import { Plus, Trash2, LogOut, Menu, X } from "lucide-react";
import toast from "react-hot-toast";

function formatThreadDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatThreadDate(dateStr);
}

export default function Sidebar({
  initialThreads,
  userId,
  userEmail,
}: {
  initialThreads: Thread[];
  userId: string;
  userEmail: string;
}) {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();

  const activeThreadId = params.threadId as string | undefined;
  const [threads, setThreads] = useState(initialThreads);
  const [newThreadIds, setNewThreadIds] = useState<Set<string>>(new Set());
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const createThread = useCallback(async () => {
    const { data, error } = await supabase
      .from("threads")
      .insert({ user_id: userId })
      .select()
      .single();

    if (error || !data) {
      toast.error("Failed to create thread");
      return;
    }

    setThreads((prev) => [data, ...prev]);
    setNewThreadIds((prev) => new Set(prev).add(data.id));
    setTimeout(() => {
      setNewThreadIds((prev) => {
        const next = new Set(prev);
        next.delete(data.id);
        return next;
      });
    }, 400);

    setMobileOpen(false);
    router.push(`/chat/${data.id}`);
  }, [supabase, userId, router]);

  const deleteThread = useCallback(
    async (e: React.MouseEvent, threadId: string) => {
      e.stopPropagation();
      if (!confirm("Delete this chat?")) return;

      const { data: docs } = await supabase
        .from("documents")
        .select("storage_path")
        .eq("thread_id", threadId);

      if (docs && docs.length > 0) {
        await supabase.storage
          .from("documents")
          .remove(docs.map((d) => d.storage_path));
      }

      const { error } = await supabase
        .from("threads")
        .delete()
        .eq("id", threadId);

      if (error) {
        toast.error("Failed to delete thread");
        return;
      }

      setThreads((prev) => prev.filter((t) => t.id !== threadId));

      if (activeThreadId === threadId) {
        router.push("/chat");
      }
    },
    [supabase, activeThreadId, router]
  );

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/login");
  }, [supabase, router]);

  const sidebar = (
    <aside className="flex h-full flex-col border-r border-pink-100 bg-surface">
      <div className="flex items-center justify-between border-b border-pink-100 px-4 py-4">
        <h1 className="bg-gradient-to-r from-pink-500 to-pink-300 bg-clip-text text-2xl font-display font-bold tracking-tight text-transparent">
          NovaGen
        </h1>
        <button
          className="cursor-pointer rounded-xl p-1.5 text-pink-500 hover:bg-bg-hover md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
      </div>

      <div className="px-3 py-3">
        <button
          onClick={createThread}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-pink-500 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-pink-600"
        >
          <Plus size={18} />
          New Chat
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-2">
        {threads.map((thread) => {
          const isActive = thread.id === activeThreadId;
          const isNew = newThreadIds.has(thread.id);

          return (
            <div
              key={thread.id}
              role="button"
              tabIndex={0}
              onClick={() => {
                setMobileOpen(false);
                router.push(`/chat/${thread.id}`);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setMobileOpen(false);
                  router.push(`/chat/${thread.id}`);
                }
              }}
              className={`group flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-all
                ${isActive ? "border-l-[3px] border-pink-500 bg-pink-100" : "border-l-[3px] border-transparent hover:bg-bg-hover"}
                ${isNew ? "animate-slide-down" : ""}
              `}
            >
              <span className="flex items-center gap-1.5 truncate text-primary">
                {thread.title}
                {(thread.document_count ?? 0) > 0 && (
                  <span className="shrink-0 text-xs" title={`${thread.document_count} document(s)`}>
                    📄
                  </span>
                )}
              </span>
              <span className="shrink-0 text-xs text-muted" suppressHydrationWarning>
                {mounted
                  ? relativeTime(thread.updated_at)
                  : formatThreadDate(thread.updated_at)}
              </span>
              <button
                onClick={(e) => deleteThread(e, thread.id)}
                className="shrink-0 cursor-pointer rounded-lg p-1 text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:bg-pink-100 hover:text-pink-500"
                aria-label="Delete thread"
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
      </nav>

      <div className="flex items-center gap-2 border-t border-pink-100 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-100 text-sm font-semibold text-pink-600">
          {userEmail.charAt(0).toUpperCase()}
        </div>
        <span className="flex-1 truncate text-sm text-secondary">
          {userEmail}
        </span>
        <button
          onClick={handleLogout}
          className="cursor-pointer rounded-lg p-1.5 text-muted transition-colors hover:bg-bg-hover hover:text-pink-500"
          aria-label="Sign out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );

  return (
    <>
      <button
        className="fixed left-3 top-3 z-50 cursor-pointer rounded-xl bg-surface p-2 shadow-md md:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Open sidebar"
      >
        <Menu size={20} className="text-pink-500" />
      </button>

      <div
        className={`fixed inset-0 z-40 bg-black/20 transition-opacity duration-[250ms] ease-in-out md:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMobileOpen(false)}
      />

      <div
        className={`flex w-[260px] shrink-0 flex-col transition-transform duration-[250ms] ease-in-out md:relative md:translate-x-0 ${
          mobileOpen
            ? "fixed left-0 top-0 z-50 translate-x-0"
            : "fixed left-0 top-0 z-50 -translate-x-full md:static md:z-auto md:translate-x-0"
        }`}
      >
        {sidebar}
      </div>
    </>
  );
}
