import { createGoogleGenerativeAI } from "@ai-sdk/google";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY");
}

export const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});
