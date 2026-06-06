import { describe, it, expect } from "vitest";

describe("getMessageText", () => {
  it("extracts text from message parts", async () => {
    const { getMessageText } = await import("@/lib/types");
    const msg = {
      parts: [
        { type: "text", text: "Hello " },
        { type: "text", text: "world" },
      ],
    } as any;
    expect(getMessageText(msg)).toBe("Hello world");
  });

  it("returns empty string when there are no text parts", async () => {
    const { getMessageText } = await import("@/lib/types");
    const msg = {
      parts: [
        { type: "tool-invocation" as const, toolInvocation: {} },
      ],
    } as any;
    expect(getMessageText(msg)).toBe("");
  });

  it("returns empty string for empty parts array", async () => {
    const { getMessageText } = await import("@/lib/types");
    const msg = { parts: [] } as any;
    expect(getMessageText(msg)).toBe("");
  });
});
