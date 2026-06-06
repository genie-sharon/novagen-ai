/**
 * Live Gemini API smoke test.
 *
 * Gated behind RUN_LIVE_SMOKE_TESTS=1.
 * Requires a valid GEMINI_API_KEY.
 * Never prints the API key.
 */
import { describe, it, expect } from "vitest";

const isEnabled =
  process.env.RUN_LIVE_SMOKE_TESTS === "1" && !!process.env.GEMINI_API_KEY;

const itWithLive = isEnabled ? it : it.skip;

describe.runIf(isEnabled)("Live Gemini API", () => {
  itWithLive("returns a non-empty reply", async () => {
    const { createGoogleGenerativeAI } = await import("@ai-sdk/google");
    const { generateText } = await import("ai");

    const google = createGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY!,
    });

    const result = await generateText({
      model: google("gemini-2.5-flash"),
      prompt: "Reply with exactly: NovaGen smoke test OK",
    });

    expect(result.text).toBeTruthy();
    expect(result.text).toContain("NovaGen");
  });
});
