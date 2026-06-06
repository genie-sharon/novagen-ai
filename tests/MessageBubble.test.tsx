import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import MessageBubble from "@/components/MessageBubble";
import type { UIMessage } from "ai";

function makeUserMessage(text: string): UIMessage {
  return {
    id: "1",
    role: "user",
    content: text,
    parts: [{ type: "text", text }],
    createdAt: new Date(),
  };
}

function makeAssistantMessage(text: string): UIMessage {
  return {
    id: "2",
    role: "assistant",
    content: text,
    parts: [{ type: "text", text }],
    createdAt: new Date(),
  };
}

describe("MessageBubble", () => {
  it("renders user message", () => {
    render(<MessageBubble message={makeUserMessage("Hello")} />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("renders assistant message", () => {
    render(<MessageBubble message={makeAssistantMessage("Hi there")} />);
    expect(screen.getByText("Hi there")).toBeInTheDocument();
  });

  it("assistant text uses readable dark-text styling", () => {
    const { container } = render(
      <MessageBubble message={makeAssistantMessage("Some answer")} />
    );
    const textEl = container.querySelector(".text-\\[\\#2A1F24\\]");
    expect(textEl).toBeInTheDocument();
  });

  it("renders Markdown paragraphs", () => {
    const text = "First paragraph.\n\nSecond paragraph.";
    render(<MessageBubble message={makeAssistantMessage(text)} />);
    expect(screen.getByText("First paragraph.")).toBeInTheDocument();
    expect(screen.getByText("Second paragraph.")).toBeInTheDocument();
  });

  it("renders inline code", () => {
    const text = "Use `const x = 1;` in your code.";
    render(<MessageBubble message={makeAssistantMessage(text)} />);
    const codeEl = screen.getByText("const x = 1;");
    expect(codeEl).toBeInTheDocument();
    expect(codeEl.tagName).toBe("CODE");
  });

  it("strips stray citation badges from assistant text", () => {
    const text =
      "NovaGen is great[1].\n\n[2]\n\nIt supports Markdown.\n.";
    render(<MessageBubble message={makeAssistantMessage(text)} />);
    expect(screen.queryByText("1")).not.toBeInTheDocument();
    expect(screen.queryByText("[1]")).not.toBeInTheDocument();
    expect(screen.queryByText("[2]")).not.toBeInTheDocument();
    expect(screen.getByText("NovaGen is great.")).toBeInTheDocument();
    expect(screen.getByText("It supports Markdown.")).toBeInTheDocument();
  });

  it("assistant avatar displays N", () => {
    render(<MessageBubble message={makeAssistantMessage("Hello")} />);
    expect(screen.getByText("N")).toBeInTheDocument();
  });

  it("old R branding is absent", () => {
    render(<MessageBubble message={makeAssistantMessage("Hello")} />);
    expect(screen.queryByText("R")).not.toBeInTheDocument();
  });

  it("renders Markdown lists", () => {
    const text = "- Item 1\n- Item 2";
    render(<MessageBubble message={makeAssistantMessage(text)} />);
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
  });

  it("renders user messages without avatar", () => {
    const { container } = render(
      <MessageBubble message={makeUserMessage("Hi")} />
    );
    // User bubbles should not have the assistant avatar with "N"
    expect(screen.queryByText("N")).not.toBeInTheDocument();
  });
});
