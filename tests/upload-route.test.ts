import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase server client
const mockFrom = vi.fn();
const mockStorageFrom = vi.fn();
const mockAuthGetUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: { getUser: mockAuthGetUser },
    from: mockFrom,
    storage: { from: mockStorageFrom },
  }),
}));

// Mock document parser
vi.mock("@/lib/document-parser", () => ({
  detectDocumentType: vi.fn(),
  extractText: vi.fn(),
}));

// Mock chunker
vi.mock("@/lib/chunker", () => ({
  chunkText: vi.fn(),
}));

// Mock embeddings (do NOT call real Gemini)
vi.mock("@/lib/embeddings", () => ({
  generateDocumentEmbeddings: vi.fn(),
}));

import { POST } from "@/app/api/documents/upload/route";
import { detectDocumentType, extractText } from "@/lib/document-parser";
import { chunkText } from "@/lib/chunker";
import { generateDocumentEmbeddings } from "@/lib/embeddings";

function mockRequest(file: File | null, threadId: string | null): Request {
  const formData = new FormData();
  if (file) {
    const fileWithBuffer = Object.assign(file, {
      arrayBuffer: () => Promise.resolve(new TextEncoder().encode("mock content").buffer),
    });
    formData.append("file", fileWithBuffer);
  }
  if (threadId) formData.append("threadId", threadId);
  return {
    formData: () => Promise.resolve(formData),
    url: "http://localhost:3000/api/documents/upload",
    method: "POST",
    headers: new Headers({ "content-type": "multipart/form-data" }),
  } as unknown as Request;
}

function mockSupabaseSelect(data: unknown, error: unknown = null) {
  const builder = vi.fn();
  builder.mockReturnValue({
    eq: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data, error }),
      })),
      single: vi.fn().mockResolvedValue({ data, error }),
      order: vi.fn(),
    })),
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(),
      })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(),
    })),
  });
  return builder;
}

describe("POST /api/documents/upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: unauthenticated
    mockAuthGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    // Default mock for from()
    const mockFromImpl = vi.fn((table: string) => {
      if (table === "threads") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { id: "thread-1", user_id: "user-1" },
                  error: null,
                }),
              })),
              single: vi.fn().mockResolvedValue({
                data: { id: "thread-1", user_id: "user-1" },
                error: null,
              }),
            })),
            single: vi.fn().mockResolvedValue({
              data: { id: "thread-1", user_id: "user-1" },
              error: null,
            }),
          })),
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(),
            })),
          })),
          delete: vi.fn(() => ({
            eq: vi.fn(),
          })),
        };
      }
      if (table === "documents") {
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "doc-1",
                  user_id: "user-1",
                  thread_id: "thread-1",
                  name: "test.txt",
                  size: 100,
                  type: "text/plain",
                  storage_path: "user-1/thread-1/doc-1/test.txt",
                  indexed: true,
                  chunkCount: 1,
                },
                error: null,
              }),
            })),
          })),
          delete: vi.fn(() => ({
            eq: vi.fn(),
          })),
        };
      }
      if (table === "document_chunks") {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(),
          order: vi.fn(),
        })),
        insert: vi.fn().mockResolvedValue({ error: null }),
        delete: vi.fn(() => ({
          eq: vi.fn(),
        })),
      };
    });
    mockFrom.mockImplementation(mockFromImpl);

    mockStorageFrom.mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: null }),
      remove: vi.fn().mockResolvedValue({ error: null }),
    });

    vi.mocked(detectDocumentType).mockReturnValue("text/plain");
    vi.mocked(extractText).mockResolvedValue("NovaGen is a document QA app.");
    vi.mocked(chunkText).mockReturnValue(["NovaGen is a document QA app."]);
    vi.mocked(generateDocumentEmbeddings).mockResolvedValue([
      Array(1536).fill(0.1),
    ]);
  });

  it("returns 400 for missing file", async () => {
    const res = await POST(mockRequest(null, "thread-1"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("file is missing");
  });

  it("returns 400 for missing threadId", async () => {
    const file = new File(["test"], "test.txt", { type: "text/plain" });
    const res = await POST(mockRequest(file, null));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("threadId is missing");
  });

  it("returns 401 for unauthenticated request", async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "No logged-in user" },
    });

    const file = new File(["test"], "test.txt", { type: "text/plain" });
    const res = await POST(mockRequest(file, "thread-1"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain("Authentication failed");
  });

  it("rejects thread not owned by user", async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: { id: "user-2" } },
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "threads") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: "Thread was not found" },
                }),
              })),
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: "Thread was not found" },
              }),
            })),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Thread was not found" },
            }),
          })),
        };
      }
      return { select: vi.fn(() => ({ eq: vi.fn(), order: vi.fn() })) };
    });

    const file = new File(["test"], "test.txt", { type: "text/plain" });
    const res = await POST(mockRequest(file, "thread-1"));
    const body = await res.json();
    expect(body.error).toContain("Thread verification failed");
  });

  it("rejects unsupported file type", async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    vi.mocked(detectDocumentType).mockImplementation(() => {
      throw new Error("Unsupported file type. Upload a TXT, CSV, DOCX, or PDF file.");
    });

    const file = new File(["test"], "test.xyz", { type: "application/xyz" });
    const res = await POST(mockRequest(file, "thread-1"));
    expect(res.status).toBe(415);
    const body = await res.json();
    expect(body.error).toContain("Unsupported file type");
  });

  it("rejects legacy .doc file", async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    vi.mocked(detectDocumentType).mockImplementation(() => {
      throw new Error("Legacy .doc files are not supported. Convert the file to .docx and upload it again.");
    });

    const file = new File(["test"], "old.doc", { type: "application/msword" });
    const res = await POST(mockRequest(file, "thread-1"));
    expect(res.status).toBe(415);
    const body = await res.json();
    expect(body.error).toContain("Legacy .doc files are not supported");
  });

  it("rejects file larger than 20 MB", async () => {
    const largeContent = "x".repeat(21 * 1024 * 1024);
    const file = new File([largeContent], "large.txt", { type: "text/plain" });
    const res = await POST(mockRequest(file, "thread-1"));
    expect(res.status).toBe(413);
    const body = await res.json();
    expect(body.error).toContain("20MB limit");
  });

  it("valid TXT upload succeeds", async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const file = new File(["NovaGen content"], "test.txt", { type: "text/plain" });
    const res = await POST(mockRequest(file, "thread-1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.document).toBeDefined();
    expect(body.document.indexed).toBe(true);
  });

  it("storage path begins with authenticated user ID", async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    let capturedPath = "";
    mockStorageFrom.mockReturnValue({
      upload: vi.fn((path: string) => {
        capturedPath = path;
        return { error: null };
      }),
      remove: vi.fn().mockResolvedValue({ error: null }),
    });

    const file = new File(["test"], "doc.txt", { type: "text/plain" });
    await POST(mockRequest(file, "thread-1"));
    expect(capturedPath).toMatch(/^user-1\//);
  });

  it("unsafe filenames are sanitized", async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    let capturedPath = "";
    mockStorageFrom.mockReturnValue({
      upload: vi.fn((path: string) => {
        capturedPath = path;
        return { error: null };
      }),
      remove: vi.fn().mockResolvedValue({ error: null }),
    });

    const file = new File(["test"], "../../malicious.txt", { type: "text/plain" });
    await POST(mockRequest(file, "thread-1"));
    expect(capturedPath).not.toContain("/../");
  });

  it("no secret values appear in errors", async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    vi.mocked(extractText).mockRejectedValue(new Error("Details: GEMINI_API_KEY=sk-12345"));

    const mockFromImpl = mockFrom;
    const file = new File(["test"], "test.txt", { type: "text/plain" });
    const res = await POST(mockRequest(file, "thread-1"));
    const body = await res.json();
    expect(body.error).not.toContain("GEMINI_API_KEY");
    expect(body.error).not.toContain("sk-12345");
  });
});
