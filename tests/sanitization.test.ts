import { describe, it, expect } from "vitest";

// The upload route uses file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

describe("filename sanitization", () => {
  it("preserves normal filename", () => {
    expect(sanitizeFilename("report.txt")).toBe("report.txt");
  });

  it("replaces spaces with underscores", () => {
    expect(sanitizeFilename("my report.pdf")).toBe("my_report.pdf");
  });

  it("removes special characters", () => {
    expect(sanitizeFilename("hello!@#$world.txt")).toBe("hello____world.txt");
  });

  it("flattens path traversal", () => {
    const result = sanitizeFilename("../../etc/passwd.txt");
    expect(result).not.toContain("/");
    // The sanitizer replaces dots but ".." may still appear as "__..__"
    // The key behavior is no path traversal components survive
    expect(result).not.toContain("../");
  });

  it("preserves unicode characters as underscores", () => {
    const result = sanitizeFilename("résumé.txt");
    expect(result).toBe("r_sum_.txt");
  });

  it("keeps file extension intact", () => {
    const result = sanitizeFilename("document..csv");
    expect(result.endsWith(".csv")).toBe(true);
  });

  it("handles filename with only special chars", () => {
    const result = sanitizeFilename("***");
    expect(result).toBe("___");
  });

  it("handles empty string", () => {
    expect(sanitizeFilename("")).toBe("");
  });
});
