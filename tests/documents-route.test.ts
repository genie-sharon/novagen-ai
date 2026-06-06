import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAuthGetUser = vi.fn();
const mockFrom = vi.fn();
const mockStorageFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: { getUser: mockAuthGetUser },
    from: mockFrom,
    storage: { from: mockStorageFrom },
  }),
}));

import { GET, DELETE } from "@/app/api/documents/[threadId]/route";

function makeRequest(url: string, method = "GET"): Request {
  return new Request(url, { method });
}

describe("GET /api/documents/[threadId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });
  });

  it("returns 401 for unauthenticated request", async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Unauthorized" },
    });

    const res = await GET(makeRequest("http://localhost:3000/api/documents/thread-1"), {
      params: { threadId: "thread-1" },
    });
    expect(res.status).toBe(401);
  });

  it("returns documents for user's own thread", async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "threads") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { id: "thread-1" },
                  error: null,
                }),
              })),
              single: vi.fn().mockResolvedValue({
                data: { id: "thread-1" },
                error: null,
              }),
            })),
            single: vi.fn().mockResolvedValue({
              data: { id: "thread-1" },
              error: null,
            }),
          })),
        };
      }
      if (table === "documents") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({
                data: [
                  { id: "doc-1", name: "test.txt", size: 100, type: "text/plain", created_at: new Date().toISOString() },
                ],
                error: null,
              }),
            })),
          })),
        };
      }
      return { select: vi.fn(() => ({ eq: vi.fn(), order: vi.fn() })) };
    });

    const res = await GET(makeRequest("http://localhost:3000/api/documents/thread-1"), {
      params: { threadId: "thread-1" },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.documents).toHaveLength(1);
    expect(body.documents[0].name).toBe("test.txt");
  });

  it("rejects access to another user's thread", async () => {
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
                  error: { message: "Thread not found" },
                }),
              })),
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: "Thread not found" },
              }),
            })),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Thread not found" },
            }),
          })),
        };
      }
      return { select: vi.fn(() => ({ eq: vi.fn(), order: vi.fn() })) };
    });

    const res = await GET(makeRequest("http://localhost:3000/api/documents/thread-1"), {
      params: { threadId: "thread-1" },
    });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/documents/[threadId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    mockStorageFrom.mockReturnValue({
      remove: vi.fn().mockResolvedValue({ error: null }),
    });
  });

  it("returns 401 for unauthenticated request", async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Unauthorized" },
    });

    const res = await DELETE(
      makeRequest("http://localhost:3000/api/documents/thread-1?documentId=doc-1", "DELETE"),
      { params: { threadId: "thread-1" } }
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 for missing document ID", async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const res = await DELETE(
      makeRequest("http://localhost:3000/api/documents/thread-1", "DELETE"),
      { params: { threadId: "thread-1" } }
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("documentId is required");
  });

  it("allows user to delete own document", async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "documents") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: "doc-1",
                      storage_path: "user-1/thread-1/doc-1/file.txt",
                      thread_id: "thread-1",
                      user_id: "user-1",
                    },
                    error: null,
                  }),
                })),
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "doc-1",
                    storage_path: "user-1/thread-1/doc-1/file.txt",
                    thread_id: "thread-1",
                    user_id: "user-1",
                  },
                  error: null,
                }),
              })),
            })),
          })),
          delete: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({ error: null }),
            })),
          })),
        };
      }
      return { select: vi.fn(() => ({ eq: vi.fn() })) };
    });

    const res = await DELETE(
      makeRequest("http://localhost:3000/api/documents/thread-1?documentId=doc-1", "DELETE"),
      { params: { threadId: "thread-1" } }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("rejects deleting another user's document", async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: { id: "user-2" } },
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "documents") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: "Document not found" },
                  }),
                })),
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: "Document not found" },
                }),
              })),
            })),
          })),
        };
      }
      return { select: vi.fn(() => ({ eq: vi.fn() })) };
    });

    const res = await DELETE(
      makeRequest("http://localhost:3000/api/documents/thread-1?documentId=doc-1", "DELETE"),
      { params: { threadId: "thread-1" } }
    );
    expect(res.status).toBe(404);
  });

  it("calls Storage removal with correct path", async () => {
    mockAuthGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const mockRemove = vi.fn().mockResolvedValue({ error: null });
    mockStorageFrom.mockReturnValue({ remove: mockRemove });

    mockFrom.mockImplementation((table: string) => {
      if (table === "documents") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: "doc-1",
                      storage_path: "user-1/thread-1/doc-1/file.txt",
                      thread_id: "thread-1",
                      user_id: "user-1",
                    },
                    error: null,
                  }),
                })),
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "doc-1",
                    storage_path: "user-1/thread-1/doc-1/file.txt",
                    thread_id: "thread-1",
                    user_id: "user-1",
                  },
                  error: null,
                }),
              })),
            })),
          })),
          delete: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({ error: null }),
            })),
          })),
        };
      }
      return { select: vi.fn(() => ({ eq: vi.fn() })) };
    });

    await DELETE(
      makeRequest("http://localhost:3000/api/documents/thread-1?documentId=doc-1", "DELETE"),
      { params: { threadId: "thread-1" } }
    );

    expect(mockRemove).toHaveBeenCalledWith(["user-1/thread-1/doc-1/file.txt"]);
  });
});
