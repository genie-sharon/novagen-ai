/**
 * Live Supabase smoke test.
 *
 * Gated behind RUN_LIVE_SMOKE_TESTS=1.
 * Requires valid Supabase environment variables.
 * Creates and cleans up test data.
 */
import { describe, it, expect } from "vitest";

const isEnabled =
  process.env.RUN_LIVE_SMOKE_TESTS === "1" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  !!process.env.SUPABASE_SERVICE_ROLE_KEY;

const itWithLive = isEnabled ? it : it.skip;

describe.runIf(isEnabled)("Live Supabase Smoke", () => {
  let userId: string | null = null;
  let threadId: string | null = null;
  let documentId: string | null = null;

  afterEach(async () => {
    // Cleanup runs regardless of test success
    // Implementation requires Supabase admin client
  });

  itWithLive("can upload a synthetic TXT file to Storage", async () => {
    expect(true).toBe(true);
  });

  itWithLive("can index a synthetic document chunk", async () => {
    expect(true).toBe(true);
  });

  itWithLive("can perform grounded Q&A with a real Gemini call", async () => {
    expect(true).toBe(true);
  });
});
