import { CheckCircle2, FileText, Loader2, X } from "lucide-react";

export type AttachmentStatus =
  | "uploading"
  | "indexing"
  | "ready"
  | "error";

export type ComposerAttachment = {
  localId: string;
  documentId?: string;
  name: string;
  type: string;
  size: number;
  status: AttachmentStatus;
  error?: string;
};

export function AttachmentChip({
  attachment,
  onRemove,
}: {
  attachment: ComposerAttachment;
  onRemove: () => void;
}) {
  return (
    <div className="relative flex max-w-[280px] items-center gap-3 rounded-2xl border border-pink-200 bg-[#FFF8FA] px-3 py-2 pr-9 shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-[#DB2777]">
        <FileText className="h-5 w-5" />
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[#2A1F24]">
          {attachment.name}
        </p>

        <div className="flex items-center gap-1 text-xs">
          {attachment.status === "uploading" && (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-[#6B5B63]">Uploading...</span>
            </>
          )}

          {attachment.status === "indexing" && (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-[#6B5B63]">Indexing...</span>
            </>
          )}

          {attachment.status === "ready" && (
            <>
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              <span className="text-green-700">Ready</span>
            </>
          )}

          {attachment.status === "error" && (
            <span className="truncate text-red-500">
              {attachment.error || "Upload failed. Please try again."}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        aria-label={`Remove ${attachment.name}`}
        onClick={onRemove}
        className="absolute right-2 top-2 rounded-full p-1 text-[#6B5B63] transition hover:bg-pink-100 hover:text-[#DB2777]"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
