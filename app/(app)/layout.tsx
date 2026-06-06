import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: threads } = await supabase
    .from("threads")
    .select("*")
    .order("updated_at", { ascending: false });

  const threadIds = (threads ?? []).map((t) => t.id);

  const docCounts: Record<string, number> = {};
  if (threadIds.length > 0) {
    const { data: docData } = await supabase
      .from("documents")
      .select("thread_id")
      .in("thread_id", threadIds);

    for (const d of docData ?? []) {
      docCounts[d.thread_id] = (docCounts[d.thread_id] || 0) + 1;
    }
  }

  const threadsWithCounts = (threads ?? []).map((t) => ({
    ...t,
    document_count: docCounts[t.id] || 0,
  }));

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        initialThreads={threadsWithCounts}
        userId={user.id}
        userEmail={user.email ?? ""}
      />
      <main className="flex flex-1 flex-col bg-bg-base">{children}</main>
    </div>
  );
}
