"use client";

import { useState } from "react";
import { FileText, Trash2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import type { Document } from "@/lib/types";

function formatSize(bytes: number | null): string {
  if (bytes === null) return "?";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const TYPE_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "text/plain": "TXT",
  "text/csv": "CSV",
};

export default function DocumentList({
  documents,
  threadId,
  onDelete,
}: {
  documents: Document[];
  threadId: string;
  onDelete: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (doc: Document) => {
    setDeleting(doc.id);

    try {
      const response = await fetch(
        `/api/documents/${threadId}?documentId=${doc.id}`,
        {
          method: "DELETE",
        }
      );

      const rawText = await response.text();
      let data: { error?: string } = {};

      try {
        data = JSON.parse(rawText);
      } catch {
        data = {
          error: rawText || "The server returned an unreadable response",
        };
      }

      if (!response.ok) {
        throw new Error(
          data.error || `Delete failed with status ${response.status}`
        );
      }

      onDelete(doc.id);
      toast.success("Document deleted");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Delete failed"
      );
    } finally {
      setDeleting(null);
    }
  };

  if (documents.length === 0) {
    return (
      <p className="py-3 text-center text-sm text-muted">
        No documents uploaded yet
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-1.5 py-1">
      {documents.map((doc) => (
        <li
          key={doc.id}
          className="flex items-center gap-2.5 rounded-xl bg-pink-50/60 px-3 py-2 text-sm"
        >
          <FileText size={16} className="shrink-0 text-pink-400" />

          <div className="min-w-0 flex-1">
            <p className="truncate text-primary">{doc.name}</p>
            <p className="text-xs text-muted">
              {TYPE_LABELS[doc.type ?? ""] ?? doc.type} &middot;{" "}
              {formatSize(doc.size)}
            </p>
            <p className="mt-0.5 text-xs">
              {doc.chunk_count && doc.chunk_count > 0 ? (
                <span className="font-medium text-emerald-600">Indexed</span>
              ) : (
                <span className="text-amber-600">Stored — re-upload to index</span>
              )}
            </p>
          </div>

          <button
            onClick={() => handleDelete(doc)}
            disabled={deleting === doc.id}
            className="shrink-0 cursor-pointer rounded-lg p-1.5 text-muted transition-colors hover:bg-pink-100 hover:text-pink-500 disabled:pointer-events-none disabled:opacity-50"
            aria-label={`Delete ${doc.name}`}
          >
            {deleting === doc.id ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}
