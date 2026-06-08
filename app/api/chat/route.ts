import { streamText, convertToModelMessages, type UIMessage, APICallError } from "ai";
import { google } from "@/lib/gemini";
import { createClient } from "@/lib/supabase/server";
import { generateQuestionEmbedding } from "@/lib/embeddings";

export const maxDuration = 30;

function getMessageText(msg: UIMessage): string {
  return msg.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export async function POST(req: Request) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error("CHAT_AUTH_ERROR: Unauthenticated request");
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const messages = body.messages as UIMessage[];
    const threadId = body.threadId as string | undefined;

    if (!messages?.length || !threadId) {
      console.error("CHAT_ROUTE_ERROR: Missing messages or threadId");
      return Response.json(
        { error: "Missing messages or threadId" },
        { status: 400 }
      );
    }

    // Verify thread ownership
    const { data: thread } = await supabase
      .from("threads")
      .select("id")
      .eq("id", threadId)
      .eq("user_id", user.id)
      .single();

    if (!thread) {
      console.error("CHAT_AUTH_ERROR: Thread not found for user");
      return Response.json({ error: "Thread not found" }, { status: 404 });
    }

    // Save user message
    const userMsg = messages[messages.length - 1];
    const userContent = getMessageText(userMsg);

    const { error: insertError } = await supabase.from("messages").insert({
      thread_id: threadId,
      role: "user",
      content: userContent,
    });

    if (insertError) {
      console.error(
        "CHAT_ROUTE_ERROR: Failed to save user message",
        insertError.message
      );
    }

    // Auto-title on first message
    if (messages.length === 1) {
      const title =
        userContent.length > 40
          ? userContent.slice(0, 40) + "..."
          : userContent;

      await supabase.from("threads").update({ title }).eq("id", threadId);
    }

    // RAG: retrieve relevant document chunks
    let systemPrompt =
      "You are NovaGen, a warm, thoughtful, and helpful AI assistant.";

    const { count } = await supabase
      .from("document_chunks")
      .select("*", { count: "exact", head: true })
      .eq("thread_id", threadId);

    const hasIndexedChunks = count !== null && count > 0;

    if (hasIndexedChunks && userContent) {
      try {
        const queryEmbedding =
          await generateQuestionEmbedding(userContent);

        const { data: matches, error: matchError } = await supabase.rpc(
          "match_chunks",
          {
            query_embedding: queryEmbedding,
            match_thread_id: threadId,
            match_count: 5,
          }
        );

        if (matchError) {
          console.error(
            "CHAT_ROUTE_ERROR: match_chunks RPC failed",
            matchError.message
          );
        }

        if (matches && (matches as unknown[]).length > 0) {
          const context = (matches as {
            id: string;
            content: string;
            document_id: string;
            similarity: number;
          }[])
            .map((match) => match.content)
            .join("\n\n");

          systemPrompt = `
You are NovaGen, a helpful document question-answering assistant.

Answer clearly and naturally using only the uploaded-document excerpts below.
Do not display excerpt numbers, source markers, citation badges, or bracketed references.
If the answer is not present in the excerpts, say:
"I could not find that information in the uploaded document."

Uploaded-document excerpts:
${context}
          `.trim();
        }
      } catch (err) {
        console.error(
          "CHAT_ROUTE_ERROR: RAG retrieval failed",
          err instanceof Error ? err.message : err
        );
      }
    }

    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      onFinish: async ({ text }) => {
        if (text) {
          const { error: saveError } = await supabase
            .from("messages")
            .insert({
              thread_id: threadId,
              role: "assistant",
              content: text,
            });

          if (saveError) {
            console.error(
              "CHAT_ROUTE_ERROR: Failed to save assistant message",
              saveError.message
            );
          }
        }
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    const isConfigError =
      error instanceof Error &&
      error.message.includes("Gemini API configuration");

    if (isConfigError) {
      console.error("CHAT_CONFIGURATION_ERROR");
      return Response.json(
        {
          error:
            "NovaGen could not generate a response. Please check the server configuration or try again later.",
        },
        { status: 500 }
      );
    }

    const isRateLimit =
      (APICallError.isInstance(error) &&
        (error as APICallError).statusCode === 429) ||
      (error instanceof Error &&
        /rate.?limit|quota|429|too many requests/i.test(error.message));

    if (isRateLimit) {
      console.error("GEMINI_RATE_LIMIT_ERROR");
      return Response.json(
        {
          error:
            "NovaGen has temporarily reached its AI usage limit. Please try again shortly.",
        },
        { status: 429 }
      );
    }

    console.error("CHAT_PROVIDER_ERROR");
    return Response.json(
      {
        error:
          "NovaGen could not generate a response. Please check the server configuration or try again later.",
      },
      { status: 500 }
    );
  }
}
