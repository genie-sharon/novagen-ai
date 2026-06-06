"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

const SUGGESTIONS = [
  "Help me write an email",
  "Explain a concept",
  "Give me a recipe",
  "Upload a document and ask questions",
];

export default function ChatPage() {
  const router = useRouter();
  const supabase = createClient();

  const handleSuggestion = async (prompt: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("threads")
      .insert({ user_id: user.id })
      .select()
      .single();

    if (error || !data) {
      toast.error("Failed to start a new chat");
      return;
    }

    router.push(`/chat/${data.id}?prompt=${encodeURIComponent(prompt)}`);
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
      <h1 className="bg-gradient-to-r from-pink-500 to-pink-300 bg-clip-text text-5xl font-display font-bold tracking-tight text-transparent">
        NovaGen
      </h1>

      <p className="text-lg text-secondary">
        Chat freely or upload documents to ask questions
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => handleSuggestion(suggestion)}
            className="cursor-pointer rounded-xl border border-pink-200 bg-surface px-4 py-2.5 text-sm text-secondary shadow-sm transition-all hover:border-pink-400 hover:text-pink-600"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
