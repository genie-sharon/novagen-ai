import { describe, it, expect, beforeEach, vi } from "vitest";

describe("gemini module", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("throws when GEMINI_API_KEY is missing", async () => {
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    await expect(async () => {
      await import("@/lib/gemini");
    }).rejects.toThrow("Missing GEMINI_API_KEY");
    if (originalKey) process.env.GEMINI_API_KEY = originalKey;
  });

  it("exports google client when GEMINI_API_KEY is set", async () => {
    process.env.GEMINI_API_KEY = "test-key-12345";
    const mod = await import("@/lib/gemini");
    expect(mod.google).toBeDefined();
    expect(typeof mod.google).toBe("function");
  });
});
