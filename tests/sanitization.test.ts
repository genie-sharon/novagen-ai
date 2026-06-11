import { describe, it, expect } from "vitest";
import { sanitizeFilename } from "@/lib/sanitize";

vi.mock("server-only", () => ({}));

describe("filename sanitization", () => {
  it("preserves normal filename", () => {
    expect(sanitizeFilename("report.txt")).toBe("report.txt");
  });

  it("replaces spaces with hyphens", () => {
    expect(sanitizeFilename("my report.pdf")).toBe("my-report.pdf");
  });

  it("replaces parentheses with hyphens", () => {
    expect(sanitizeFilename("Module 2 (1).pdf")).toBe("module-2-1.pdf");
  });

  it("removes special characters", () => {
    expect(sanitizeFilename("hello!@#$world.txt")).toBe("hello-world.txt");
  });

  it("flattens path traversal", () => {
    const result = sanitizeFilename("../../etc/passwd.txt");
    expect(result).not.toContain("/");
    expect(result).not.toContain("../");
    expect(result).toBe("passwd.txt");
  });

  it("handles unicode characters", () => {
    const result = sanitizeFilename("résumé.txt");
    expect(result).not.toContain("é");
  });

  it("keeps file extension intact", () => {
    const result = sanitizeFilename("document.csv");
    expect(result).toBe("document.csv");
  });

  it("handles filename with only special chars", () => {
    const result = sanitizeFilename("***");
    expect(result).toBe("file");
  });

  it("handles empty string", () => {
    expect(sanitizeFilename("")).toBe("file");
  });

  it("preserves uppercase extension lowered", () => {
    expect(sanitizeFilename("DOCUMENT.PDF")).toBe("document.pdf");
  });

  it("handles mixed-case extension", () => {
    expect(sanitizeFilename("Report.Docx")).toBe("report.docx");
  });

  it("preserves hyphens and underscores", () => {
    expect(sanitizeFilename("my-doc_file.txt")).toBe("my-doc_file.txt");
  });

  it("handles filename without extension", () => {
    expect(sanitizeFilename("README")).toBe("readme");
  });
});
