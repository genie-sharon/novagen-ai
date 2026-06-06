import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: { threadId: string } }
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { threadId } = params;

    const { data: thread } = await supabase
      .from("threads")
      .select("id")
      .eq("id", threadId)
      .eq("user_id", user.id)
      .single();

    if (!thread) {
      return Response.json({ error: "Thread not found" }, { status: 404 });
    }

    const { data: documents, error } = await supabase
      .from("documents")
      .select("id, name, size, type, created_at")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: false });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ documents });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { threadId: string } }
) {
  try {
    const supabase = createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const documentId =
      new URL(request.url).searchParams.get("documentId");

    if (!documentId) {
      return Response.json(
        { error: "documentId is required" },
        { status: 400 }
      );
    }

    const { data: document, error: fetchError } = await supabase
      .from("documents")
      .select("id, storage_path, thread_id, user_id")
      .eq("id", documentId)
      .eq("thread_id", params.threadId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !document) {
      return Response.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const { error: storageError } = await supabase.storage
      .from("documents")
      .remove([document.storage_path]);

    if (storageError) {
      throw new Error(
        `Storage delete failed: ${storageError.message}`
      );
    }

    const { error: deleteError } = await supabase
      .from("documents")
      .delete()
      .eq("id", document.id)
      .eq("user_id", user.id);

    if (deleteError) {
      throw new Error(
        `Document row deletion failed: ${deleteError.message}`
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);

    console.error("DOCUMENT_DELETE_ERROR:", message);

    return Response.json(
      { error: message },
      { status: 500 }
    );
  }
}
