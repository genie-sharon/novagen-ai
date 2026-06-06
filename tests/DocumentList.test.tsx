import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DocumentList from "@/components/DocumentList";

const mockDocuments = [
  {
    id: "doc-1",
    name: "report.txt",
    type: "text/plain",
    size: 5120,
    user_id: "user-1",
    thread_id: "thread-1",
    storage_path: "user-1/thread-1/report.txt",
    created_at: "2025-01-01T00:00:00Z",
    chunk_count: 3,
  },
  {
    id: "doc-2",
    name: "data.csv",
    type: "text/csv",
    size: 1048576,
    user_id: "user-1",
    thread_id: "thread-1",
    storage_path: "user-1/thread-1/data.csv",
    created_at: "2025-01-02T00:00:00Z",
    chunk_count: 0,
  },
  {
    id: "doc-3",
    name: "big.pdf",
    type: "application/pdf",
    size: 5242880,
    user_id: "user-1",
    thread_id: "thread-1",
    storage_path: "user-1/thread-1/big.pdf",
    created_at: "2025-01-03T00:00:00Z",
    chunk_count: null as any,
  },
];

const mockOnDelete = vi.fn();

beforeEach(() => {
  mockOnDelete.mockReset();
  global.fetch = vi.fn();
});

function renderList(documents = mockDocuments) {
  return render(
    <DocumentList documents={documents} threadId="thread-1" onDelete={mockOnDelete} />
  );
}

describe("DocumentList", () => {
  it("shows empty state when no documents", () => {
    renderList([]);
    expect(screen.getByText("No documents uploaded yet")).toBeDefined();
  });

  it("renders document names", () => {
    renderList();
    expect(screen.getByText("report.txt")).toBeDefined();
    expect(screen.getByText("data.csv")).toBeDefined();
  });

  it("shows indexed status for documents with chunks", () => {
    renderList();
    const indexed = screen.getAllByText("Indexed");
    expect(indexed.length).toBe(1);
  });

  it("shows stored status for documents without chunks", () => {
    renderList();
    const items = screen.getAllByText("Stored — re-upload to index");
    expect(items.length).toBe(2);
  });

  it("shows file type labels", () => {
    renderList();
    expect(screen.getByText(/TXT/)).toBeDefined();
    expect(screen.getByText(/CSV/)).toBeDefined();
    expect(screen.getByText(/PDF/)).toBeDefined();
  });

  it("formats file sizes", () => {
    renderList();
    expect(screen.getByText(/5\.0 KB/)).toBeDefined();
    expect(screen.getByText(/1\.0 MB/)).toBeDefined();
    expect(screen.getByText(/5\.0 MB/)).toBeDefined();
  });

  it("calls onDelete after successful delete", async () => {
    const user = userEvent.setup();
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ success: true })),
    } as Response);

    renderList();
    const deleteBtn = screen.getAllByRole("button", { name: /Delete/ })[0];
    await user.click(deleteBtn);

    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalledWith("doc-1");
    });
  });

  it("handles delete API error gracefully", async () => {
    const user = userEvent.setup();
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve("Server error"),
    } as Response);

    renderList();
    const deleteBtn = screen.getAllByRole("button", { name: /Delete/ })[0];
    await user.click(deleteBtn);

    await waitFor(() => {
      expect(mockOnDelete).not.toHaveBeenCalled();
    });
  });

  it("handles non-JSON delete error response", async () => {
    const user = userEvent.setup();
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve("Internal Server Error"),
    } as Response);

    renderList();
    const deleteBtn = screen.getAllByRole("button", { name: /Delete/ })[0];
    await user.click(deleteBtn);

    await waitFor(() => {
      expect(mockOnDelete).not.toHaveBeenCalled();
    });
  });

  it("shows null size as ?", () => {
    const docs = [
      {
        ...mockDocuments[0],
        size: null,
        chunk_count: 1,
      },
    ];
    renderList(docs);
    expect(screen.getByText(/\?/)).toBeDefined();
  });
});
