"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Loader2 } from "lucide-react";

const SUPPORTED_FORMATS = ["PDF", "DOCX", "TXT", "CSV"];

export default function DocumentUploader({
  threadId,
  onUploadComplete,
}: {
  threadId: string;
  onUploadComplete: (document: { id: string; name: string }) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(
    async (file: File) => {
      const extension = file.name.split(".").pop()?.toLowerCase() || "";

      if (extension === "doc") {
        setError(
          "Legacy .doc files are not supported. Convert the file to .docx and upload it again."
        );
        return;
      }

      if (file.size > 20 * 1024 * 1024) {
        setError("File exceeds 20MB limit");
        return;
      }

      setUploading(true);
      setError("");

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("threadId", threadId);

        const response = await fetch("/api/documents/upload", {
          method: "POST",
          body: formData,
        });

        const rawText = await response.text();

        let data: { error?: string; document?: { id: string; name: string } } =
          {};

        try {
          data = JSON.parse(rawText);
        } catch {
          data = {
            error: rawText || "The server returned an unreadable response",
          };
        }

        if (!response.ok) {
          throw new Error(
            data.error || `Document upload failed with status ${response.status}`
          );
        }

        setError("");
        onUploadComplete(data.document!);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Document upload failed"
        );
      } finally {
        setUploading(false);
      }
    },
    [threadId, onUploadComplete]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) upload(file);
    },
    [upload]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) upload(file);
      if (inputRef.current) inputRef.current.value = "";
    },
    [upload]
  );

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed p-4 text-center transition-colors ${
          dragOver
            ? "border-pink-400 bg-pink-50"
            : "border-pink-200 hover:border-pink-300 hover:bg-pink-50/50"
        } ${uploading ? "pointer-events-none opacity-60" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.csv,.docx,.pdf,text/plain,text/csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={handleChange}
        />

        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-sm text-pink-600">
            <Loader2 size={18} className="animate-spin" />
            Uploading and indexing...
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-sm text-secondary">
            <Upload size={18} className="text-pink-400" />
            <span>Drop a file here or click to browse</span>
          </div>
        )}

        <div className="mt-2 flex flex-wrap justify-center gap-1">
          {SUPPORTED_FORMATS.map((label) => (
            <span
              key={label}
              className="rounded-md bg-pink-100 px-2 py-0.5 text-xs text-pink-600"
            >
              {label}
            </span>
          ))}
        </div>
        <p className="mt-1 text-xs text-muted">
          Supported: TXT, CSV, DOCX, PDF — Max 20 MB
        </p>
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
