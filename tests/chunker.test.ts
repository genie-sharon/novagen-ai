import { describe, it, expect } from "vitest";
import { chunkText } from "@/lib/chunker";

describe("chunkText", () => {
  it("returns empty array for empty input", () => {
    expect(chunkText("")).toEqual([]);
  });

  it("returns empty array for whitespace-only input", () => {
    expect(chunkText("   \n\n  \t  ")).toEqual([]);
  });

  it("creates one chunk for a short text", () => {
    const result = chunkText("NovaGen is an AI assistant.");
    expect(result).toHaveLength(1);
    expect(result[0]).toBe("NovaGen is an AI assistant.");
  });

  it("normalizes whitespace", () => {
    const result = chunkText("  NovaGen   is    an   AI   assistant.  ");
    expect(result).toHaveLength(1);
    expect(result[0]).toBe("NovaGen is an AI assistant.");
  });

  it("creates multiple chunks for long text", () => {
    const words = Array.from({ length: 500 }, (_, i) => `word${i}`);
    const text = words.join(" ");
    const result = chunkText(text, 100, 0);
    expect(result.length).toBeGreaterThan(1);
    expect(result[0].split(" ").length).toBeLessThanOrEqual(100);
  });

  it("preserves chunk overlap", () => {
    const words = Array.from({ length: 50 }, (_, i) => `word${i}`);
    const text = words.join(" ");
    const result = chunkText(text, 20, 5);
    expect(result.length).toBeGreaterThan(1);
    const firstChunkWords = result[0].split(" ");
    const secondChunkWords = result[1].split(" ");
    const overlap = firstChunkWords.filter((w) => secondChunkWords.includes(w));
    expect(overlap.length).toBeGreaterThan(0);
  });

  it("respects custom chunk size", () => {
    const words = Array.from({ length: 100 }, (_, i) => `word${i}`);
    const text = words.join(" ");
    const result = chunkText(text, 10, 0);
    for (const chunk of result) {
      const count = chunk.split(" ").length;
      expect(count).toBeLessThanOrEqual(10);
    }
  });

  it("returns no empty chunks", () => {
    const words = Array.from({ length: 100 }, (_, i) => `word${i}`);
    const text = words.join(" ");
    const result = chunkText(text, 30, 5);
    for (const chunk of result) {
      expect(chunk.trim().length).toBeGreaterThan(0);
    }
  });
});
