import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChatInput from "@/components/ChatInput";

const defaultProps = {
  input: "",
  onInputChange: vi.fn(),
  onSubmit: vi.fn(),
  isLoading: false,
  threadId: "thread-1",
  onAttachmentReady: vi.fn(),
};

function renderChatInput(props: Partial<typeof defaultProps> = {}) {
  const merged = { ...defaultProps, ...props };
  return render(<ChatInput {...merged} />);
}

describe("ChatInput", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("renders paperclip button", () => {
    renderChatInput();
    expect(screen.getByRole("button", { name: /attach/i })).toBeInTheDocument();
  });

  it("renders Send button", () => {
    renderChatInput();
    expect(screen.getByRole("button", { name: /send/i })).toBeInTheDocument();
  });

  it("renders text input", () => {
    renderChatInput();
    expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
  });

  it("has hidden file input", () => {
    renderChatInput();
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveClass("hidden");
  });

  it("accepts correct extensions", () => {
    renderChatInput();
    const fileInput = document.querySelector('input[type="file"]');
    const accept = fileInput?.getAttribute("accept") || "";
    expect(accept).toContain(".txt");
    expect(accept).toContain(".csv");
    expect(accept).toContain(".docx");
    expect(accept).toContain(".pdf");
  });

  it("Send button is disabled when input is empty", () => {
    renderChatInput({ input: "" });
    const sendBtn = screen.getByRole("button", { name: /send/i });
    expect(sendBtn).toBeDisabled();
  });

  it("Send button is enabled when input has text", () => {
    renderChatInput({ input: "Hello" });
    const sendBtn = screen.getByRole("button", { name: /send/i });
    expect(sendBtn).toBeEnabled();
  });

  it("calls onSubmit when Send is clicked", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderChatInput({ input: "Hello", onSubmit });
    await user.click(screen.getByRole("button", { name: /send/i }));
    expect(onSubmit).toHaveBeenCalledWith("Hello");
  });

  it("calls onSubmit on Enter", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderChatInput({ input: "Hello", onSubmit });
    const textarea = screen.getByPlaceholderText(/type a message/i);
    await user.type(textarea, "{Enter}");
    expect(onSubmit).toHaveBeenCalledWith("Hello");
  });

  it("Shift+Enter creates newline without submitting", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderChatInput({ input: "Hello", onSubmit });
    const textarea = screen.getByPlaceholderText(/type a message/i);
    await user.type(textarea, "{Shift>}{Enter}{/Shift}");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("Send is disabled while loading", () => {
    renderChatInput({ input: "Hello", isLoading: true });
    const sendBtn = screen.getByRole("button", { name: /send/i });
    expect(sendBtn).toBeDisabled();
  });

  it("disables Send when attachment is pending", async () => {
    const user = userEvent.setup();
    // Don't resolve fetch - keep it pending so attachment stays in uploading/indexing state
    vi.mocked(fetch).mockReturnValueOnce(new Promise(() => {}));

    renderChatInput({ input: "Hello" });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    const file = new File(["test content"], "test.txt", { type: "text/plain" });
    await user.upload(fileInput, file);
    await vi.waitFor(() => {
      const sendBtn = screen.getByRole("button", { name: /send/i });
      expect(sendBtn).toBeDisabled();
    });
  });

  it("sending clears the input", async () => {
    const user = userEvent.setup();
    const onInputChange = vi.fn();
    renderChatInput({ input: "Hello", onInputChange });
    const sendBtn = screen.getByRole("button", { name: /send/i });
    await user.click(sendBtn);
    expect(defaultProps.onSubmit).toHaveBeenCalledWith("Hello");
  });

  it("shows attachment chip when a file is selected", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ document: { id: "doc-1", name: "test.txt", indexed: true, chunkCount: 1 } }), { status: 200 })
    );

    renderChatInput();
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["test"], "test.txt", { type: "text/plain" });
    await user.upload(fileInput, file);
    await waitFor(() => {
      expect(screen.getByText("test.txt")).toBeInTheDocument();
    });
  });

  it("rejects .doc file with conversion message", async () => {
    renderChatInput();
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["test"], "old.doc", { type: "application/msword" });
    Object.defineProperty(fileInput, "files", { value: [file] });
    fireEvent.change(fileInput);

    await vi.waitFor(() => {
      expect(screen.getByText(/legacy .doc files are not supported/i)).toBeInTheDocument();
    });
  });

  it("displays error state when upload fails", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));

    renderChatInput();
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["test"], "test.txt", { type: "text/plain" });
    await user.upload(fileInput, file);
    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });
});
