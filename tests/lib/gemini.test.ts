import { describe, it, expect, beforeEach, vi } from "vitest";

describe("gemini module", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("throws when google is called with missing key", async () => {
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    const mod = await import("@/lib/gemini");
    expect(() => mod.google("gemini-2.5-flash")).toThrow(
      "Gemini API configuration is missing."
    );
    if (originalKey) process.env.GEMINI_API_KEY = originalKey;
  });

  it("exports google as a function when GEMINI_API_KEY is set", async () => {
    process.env.GEMINI_API_KEY = "test-key-12345";
    const mod = await import("@/lib/gemini");
    expect(mod.google).toBeDefined();
    expect(typeof mod.google).toBe("function");
  });

  it("throws when google is called with a multi-line key", async () => {
    process.env.GEMINI_API_KEY = "key-line-1\nkey-line-2";
    const mod = await import("@/lib/gemini");
    expect(() => mod.google("gemini-2.5-flash")).toThrow(
      "Gemini API configuration is invalid."
    );
  });

  it("throws on google.embedding when key has embedded spaces", async () => {
    process.env.GEMINI_API_KEY = "key with spaces";
    const mod = await import("@/lib/gemini");
    expect(() => mod.google.embedding("gemini-embedding-001")).toThrow(
      "Gemini API configuration is invalid."
    );
  });
});
