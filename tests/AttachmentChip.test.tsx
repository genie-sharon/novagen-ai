import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AttachmentChip, type ComposerAttachment } from "@/components/AttachmentChip";

const baseAttachment: ComposerAttachment = {
  localId: "abc-123",
  name: "report.pdf",
  type: "application/pdf",
  size: 1024,
  status: "uploading",
};

function renderChip(overrides: Partial<ComposerAttachment> = {}) {
  const attachment = { ...baseAttachment, ...overrides };
  const onRemove = vi.fn();
  const result = render(<AttachmentChip attachment={attachment} onRemove={onRemove} />);
  return { onRemove, attachment, result };
}

describe("AttachmentChip", () => {
  it("displays filename", () => {
    renderChip();
    expect(screen.getByText("report.pdf")).toBeInTheDocument();
  });

  it("shows uploading status", () => {
    renderChip({ status: "uploading" });
    expect(screen.getByText("Uploading...")).toBeInTheDocument();
  });

  it("shows indexing status", () => {
    renderChip({ status: "indexing" });
    expect(screen.getByText("Indexing...")).toBeInTheDocument();
  });

  it("shows ready status", () => {
    renderChip({ status: "ready" });
    expect(screen.getByText("Ready")).toBeInTheDocument();
  });

  it("shows error status", () => {
    renderChip({ status: "error", error: "Upload failed" });
    expect(screen.getByText("Upload failed")).toBeInTheDocument();
  });

  it("displays custom error message", () => {
    renderChip({
      status: "error",
      error: "File too large",
    });
    expect(screen.getByText("File too large")).toBeInTheDocument();
  });

  it("shows default error text when error is empty", () => {
    renderChip({ status: "error", error: undefined });
    expect(screen.getByText("Upload failed")).toBeInTheDocument();
  });

  it("calls onRemove when remove button is clicked", async () => {
    const user = userEvent.setup();
    const { onRemove } = renderChip();
    const removeBtn = screen.getByRole("button", { name: /remove report.pdf/i });
    await user.click(removeBtn);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("remove button is accessible", () => {
    renderChip();
    const btn = screen.getByRole("button", { name: /remove report.pdf/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute("aria-label", "Remove report.pdf");
  });

  it("renders file icon", () => {
    renderChip();
    // Lucide FileText icon renders as SVG
    expect(document.querySelector("svg")).toBeInTheDocument();
  });
});
