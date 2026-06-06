"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { ArrowUp, Loader2, Paperclip } from "lucide-react";
import {
  AttachmentChip,
  type ComposerAttachment,
} from "@/components/AttachmentChip";

export default function ChatInput({
  input,
  onInputChange,
  onSubmit,
  isLoading,
  threadId,
  onAttachmentReady,
}: {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (text: string) => void;
  isLoading: boolean;
  threadId: string;
  onAttachmentReady: (doc: {
    id: string;
    name: string;
    chunkCount?: number;
  }) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);

  const hasPendingAttachment = attachments.some(
    (a) => a.status === "uploading" || a.status === "indexing"
  );

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }, []);

  useEffect(() => {
    autoResize();
  }, [input, autoResize]);

  const uploadAttachment = useCallback(
    async (file: File) => {
      const localId = crypto.randomUUID();

      setAttachments((current) => [
        ...current,
        {
          localId,
          name: file.name,
          type: file.type,
          size: file.size,
          status: "uploading",
        },
      ]);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("threadId", threadId);

        setAttachments((current) =>
          current.map((attachment) =>
            attachment.localId === localId
              ? { ...attachment, status: "indexing" }
              : attachment
          )
        );

        const response = await fetch("/api/documents/upload", {
          method: "POST",
          body: formData,
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error || "Document upload failed");
        }

        setAttachments((current) =>
          current.map((attachment) =>
            attachment.localId === localId
              ? {
                  ...attachment,
                  documentId: data.document.id,
                  status: "ready",
                }
              : attachment
          )
        );

        onAttachmentReady(data.document);
      } catch (error) {
        setAttachments((current) =>
          current.map((attachment) =>
            attachment.localId === localId
              ? {
                  ...attachment,
                  status: "error",
                  error:
                    error instanceof Error
                      ? error.message
                      : "Document upload failed",
                }
              : attachment
          )
        );
      }
    },
    [threadId, onAttachmentReady]
  );

  const removeAttachment = useCallback(
    async (attachment: ComposerAttachment) => {
      if (attachment.documentId) {
        try {
          await fetch(
            `/api/documents/${threadId}?documentId=${attachment.documentId}`,
            { method: "DELETE" }
          );
        } catch {
          // silently ignore delete errors during removal
        }
      }

      setAttachments((current) =>
        current.filter((a) => a.localId !== attachment.localId)
      );
    },
    [threadId]
  );

  const handleFileSelection = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const extension = file.name.split(".").pop()?.toLowerCase() || "";

      if (extension === "doc") {
        const localId = crypto.randomUUID();
        setAttachments((current) => [
          ...current,
          {
            localId,
            name: file.name,
            type: file.type,
            size: file.size,
            status: "error",
            error:
              "Legacy .doc files are not supported. Convert the file to .docx and upload it again.",
          },
        ]);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      uploadAttachment(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [uploadAttachment]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoading && input.trim() && !hasPendingAttachment) {
      onSubmit(input);
      setAttachments([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim() && !hasPendingAttachment) {
        onSubmit(input);
        setAttachments([]);
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-4xl rounded-3xl border border-pink-200 bg-white px-4 py-3 shadow-sm"
    >
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map((attachment) => (
            <AttachmentChip
              key={attachment.localId}
              attachment={attachment}
              onRemove={() => removeAttachment(attachment)}
            />
          ))}
        </div>
      )}

      <div className="flex items-end gap-3">
        <button
          type="button"
          aria-label="Attach document"
          onClick={() => fileInputRef.current?.click()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#2A1F24] transition hover:bg-pink-50"
        >
          <Paperclip className="h-5 w-5" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".txt,.csv,.docx,.pdf,text/plain,text/csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleFileSelection}
        />

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            attachments.length > 0
              ? "Ask NovaGen about the attached document..."
              : "Type a message..."
          }
          rows={1}
          className="max-h-32 min-h-[40px] flex-1 resize-none bg-transparent px-1 py-2 text-[#2A1F24] outline-none placeholder:text-[#B497A3]"
        />

        <button
          type="submit"
          aria-label="Send message"
          disabled={!input.trim() || hasPendingAttachment || isLoading}
          className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-[#EC4899] px-4 font-semibold text-white transition hover:bg-[#DB2777] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <span>Send</span>
              <ArrowUp className="h-5 w-5" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
