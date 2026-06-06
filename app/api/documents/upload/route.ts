import { createClient } from "@/lib/supabase/server";
import {
  detectDocumentType,
  extractText,
} from "@/lib/document-parser";
import { chunkText } from "@/lib/chunker";
import { generateDocumentEmbeddings } from "@/lib/embeddings";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let stage = "initializing";

  try {
    stage = "creating Supabase server client";
    const supabase = createClient();

    stage = "reading form data";
    const formData = await request.formData();

    const file = formData.get("file");
    const threadId = formData.get("threadId");

    if (!(file instanceof File)) {
      return Response.json(
        { error: "Upload failed: file is missing" },
        { status: 400 }
      );
    }

    if (typeof threadId !== "string" || !threadId) {
      return Response.json(
        { error: "Upload failed: threadId is missing" },
        { status: 400 }
      );
    }

    if (file.size > 20 * 1024 * 1024) {
      return Response.json(
        { error: "File exceeds 20MB limit" },
        { status: 413 }
      );
    }

    stage = "detecting document type";
    let normalizedMimeType: string;

    try {
      normalizedMimeType = detectDocumentType(file.name, file.type);
    } catch (err) {
      return Response.json(
        {
          error:
            err instanceof Error
              ? err.message
              : "Unsupported file type",
        },
        { status: 415 }
      );
    }

    stage = "authenticating user";
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error(
        `Authentication failed: ${authError?.message || "No logged-in user"}`
      );
    }

    stage = "verifying thread ownership";
    const { data: thread, error: threadError } = await supabase
      .from("threads")
      .select("id")
      .eq("id", threadId)
      .eq("user_id", user.id)
      .single();

    if (threadError || !thread) {
      throw new Error(
        `Thread verification failed: ${
          threadError?.message || "Thread was not found"
        }`
      );
    }

    stage = "preparing file path";
    const buffer = Buffer.from(await file.arrayBuffer());
    const documentId = crypto.randomUUID();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath =
      `${user.id}/${threadId}/${documentId}/${safeFileName}`;

    stage = "uploading file to Supabase Storage";
    const { error: storageError } = await supabase.storage
      .from("documents")
      .upload(storagePath, buffer, {
        contentType: normalizedMimeType,
        upsert: false,
      });

    if (storageError) {
      throw new Error(`Storage upload failed: ${storageError.message}`);
    }

    stage = "inserting document row";
    const { data: documentRow, error: documentError } = await supabase
      .from("documents")
      .insert({
        id: documentId,
        user_id: user.id,
        thread_id: threadId,
        name: file.name,
        size: file.size,
        type: normalizedMimeType,
        storage_path: storagePath,
      })
      .select()
      .single();

    if (documentError) {
      await supabase.storage.from("documents").remove([storagePath]);
      throw new Error(
        `Document row insertion failed: ${documentError.message}`
      );
    }

    stage = "extracting document text";
    let text: string;
    try {
      text = await extractText(buffer, normalizedMimeType);
    } catch (err) {
      await supabase.storage.from("documents").remove([storagePath]);
      await supabase.from("documents").delete().eq("id", documentId);
      throw new Error(
        err instanceof Error ? err.message : "Text extraction failed"
      );
    }

    if (!text) {
      await supabase.storage.from("documents").remove([storagePath]);
      await supabase.from("documents").delete().eq("id", documentId);
      throw new Error("No text could be extracted from the file");
    }

    stage = "chunking extracted text";
    const chunks = chunkText(text);

    if (chunks.length === 0) {
      await supabase.storage.from("documents").remove([storagePath]);
      await supabase.from("documents").delete().eq("id", documentId);
      throw new Error("No usable text chunks were created");
    }

    stage = "generating Gemini document embeddings";
    let embeddings: number[][];
    try {
      embeddings = await generateDocumentEmbeddings(chunks);
    } catch (err) {
      await supabase.storage.from("documents").remove([storagePath]);
      await supabase.from("documents").delete().eq("id", documentId);
      throw new Error(
        err instanceof Error
          ? `Embedding generation failed: ${err.message}`
          : "Embedding generation failed"
      );
    }

    stage = "inserting indexed document chunks";
    const chunkRows = chunks.map((content, index) => ({
      document_id: documentId,
      thread_id: threadId,
      content,
      embedding: embeddings[index],
      chunk_index: index,
    }));

    const { error: chunkInsertError } = await supabase
      .from("document_chunks")
      .insert(chunkRows);

    if (chunkInsertError) {
      await supabase.storage.from("documents").remove([storagePath]);
      await supabase.from("documents").delete().eq("id", documentId);
      throw new Error(
        `Document chunk insertion failed: ${chunkInsertError.message}`
      );
    }

    console.log(
      "UPLOAD_SUCCESS: Inserted",
      chunks.length,
      "chunks for document",
      documentId
    );

    stage = "returning success response";

    return Response.json({
      success: true,
      document: {
        ...documentRow,
        indexed: true,
        chunkCount: chunks.length,
      },
    });
  } catch (error) {
    const rawMessage =
      error instanceof Error ? error.message : String(error);

    console.error("UPLOAD_FAILED_STAGE:", stage);
    console.error("UPLOAD_FAILED_MESSAGE:", rawMessage);
    console.error("UPLOAD_FAILED_ERROR:", error);

    const message = rawMessage.replace(
      /(?:[A-Z_]+_KEY|key|secret|password|token|credential).*$/gmi,
      "sensitive information redacted"
    );

    return Response.json(
      {
        error: `Upload failed during ${stage}: ${message}`,
      },
      { status: 500 }
    );
  }
}
