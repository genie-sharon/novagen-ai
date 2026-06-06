import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DocumentUploader from "@/components/DocumentUploader";

const mockOnUploadComplete = vi.fn();

beforeEach(() => {
  mockOnUploadComplete.mockReset();
  global.fetch = vi.fn();
});

function renderUploader() {
  return render(
    <DocumentUploader threadId="thread-1" onUploadComplete={mockOnUploadComplete} />
  );
}

function createFile(name: string, size: number = 1024, type: string = "text/plain"): File {
  return new File([new ArrayBuffer(size)], name, { type });
}

function getFileInput(container: HTMLElement): HTMLInputElement {
  return container.querySelector('input[type="file"]')!;
}

describe("DocumentUploader", () => {
  it("renders upload UI", () => {
    renderUploader();
    expect(screen.getByText("Drop a file here or click to browse")).toBeDefined();
    expect(screen.getByText("PDF")).toBeDefined();
    expect(screen.getByText("DOCX")).toBeDefined();
    expect(screen.getByText("TXT")).toBeDefined();
    expect(screen.getByText("CSV")).toBeDefined();
  });

  it("shows uploading state when uploading", async () => {
    const user = userEvent.setup();
    vi.mocked(global.fetch).mockImplementationOnce(() => new Promise(() => {}));

    const { container } = renderUploader();
    const input = getFileInput(container);
    await user.upload(input, createFile("test.txt"));

    expect(await screen.findByText("Uploading and indexing...")).toBeDefined();
  });

  it("rejects legacy .doc files", async () => {
    const user = userEvent.setup();
    const { container } = renderUploader();
    const input = getFileInput(container);
    await user.upload(input, createFile("old.doc"));

    expect(
      await screen.findByText(
        "Legacy .doc files are not supported. Convert the file to .docx and upload it again."
      )
    ).toBeDefined();
  });

  it("rejects files over 20MB", async () => {
    const user = userEvent.setup();
    const { container } = renderUploader();
    const input = getFileInput(container);
    await user.upload(input, createFile("large.txt", 21 * 1024 * 1024));

    expect(await screen.findByText("File exceeds 20MB limit")).toBeDefined();
  });

  it("calls onUploadComplete on success", async () => {
    const user = userEvent.setup();
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      text: () =>
        Promise.resolve(
          JSON.stringify({ document: { id: "doc-1", name: "test.txt" } })
        ),
    } as Response);

    const { container } = renderUploader();
    const input = getFileInput(container);
    await user.upload(input, createFile("test.txt"));

    await waitFor(() => {
      expect(mockOnUploadComplete).toHaveBeenCalledWith({
        id: "doc-1",
        name: "test.txt",
      });
    });
  });

  it("shows error on upload failure", async () => {
    const user = userEvent.setup();
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve(JSON.stringify({ error: "Upload failed" })),
    } as Response);

    const { container } = renderUploader();
    const input = getFileInput(container);
    await user.upload(input, createFile("test.txt"));

    expect(await screen.findByText("Upload failed")).toBeDefined();
  });

  it("handles non-JSON error response", async () => {
    const user = userEvent.setup();
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve("Internal Server Error"),
    } as Response);

    const { container } = renderUploader();
    const input = getFileInput(container);
    await user.upload(input, createFile("test.txt"));

    expect(await screen.findByText("Internal Server Error")).toBeDefined();
  });
});
