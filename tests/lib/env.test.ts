import { describe, it, expect, beforeEach, vi } from "vitest";

describe("getGeminiApiKey", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("accepts a valid one-line key", async () => {
    process.env.GEMINI_API_KEY = "AIzaSyValidKey12345";
    const { getGeminiApiKey } = await import("@/lib/env");
    expect(getGeminiApiKey()).toBe("AIzaSyValidKey12345");
  });

  it("trims surrounding whitespace", async () => {
    process.env.GEMINI_API_KEY = "  AIzaSySpacedKey  ";
    const { getGeminiApiKey } = await import("@/lib/env");
    expect(getGeminiApiKey()).toBe("AIzaSySpacedKey");
  });

  it("rejects a missing key", async () => {
    delete process.env.GEMINI_API_KEY;
    const { getGeminiApiKey } = await import("@/lib/env");
    expect(() => getGeminiApiKey()).toThrow(
      "Gemini API configuration is missing."
    );
  });

  it("rejects a key with a newline", async () => {
    process.env.GEMINI_API_KEY = "line1\nline2";
    const { getGeminiApiKey } = await import("@/lib/env");
    expect(() => getGeminiApiKey()).toThrow(
      "Gemini API configuration is invalid."
    );
  });

  it("rejects a key with repeated lines (\\n\\n)", async () => {
    process.env.GEMINI_API_KEY = "key\n\n\n";
    const { getGeminiApiKey } = await import("@/lib/env");
    expect(() => getGeminiApiKey()).toThrow(
      "Gemini API configuration is invalid."
    );
  });

  it("rejects a key with carriage return", async () => {
    process.env.GEMINI_API_KEY = "key\rvalue";
    const { getGeminiApiKey } = await import("@/lib/env");
    expect(() => getGeminiApiKey()).toThrow(
      "Gemini API configuration is invalid."
    );
  });

  it("rejects a key with embedded spaces", async () => {
    process.env.GEMINI_API_KEY = "key with spaces";
    const { getGeminiApiKey } = await import("@/lib/env");
    expect(() => getGeminiApiKey()).toThrow(
      "Gemini API configuration is invalid."
    );
  });
});