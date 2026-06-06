import { describe, it, expect, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: () => ({
    getAll: () => [{ name: "test", value: "val" }],
    set: vi.fn(),
  }),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({ server: true })),
}));

describe("supabase server client", () => {
  it("creates a server client", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const client = createClient();
    expect(client).toEqual({ server: true });
  });
});
