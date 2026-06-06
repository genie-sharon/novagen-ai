import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: vi.fn(() => ({ browser: true })),
}));

describe("supabase browser client", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("creates a browser client", async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const client = createClient();
    expect(client).toEqual({ browser: true });
  });
});
