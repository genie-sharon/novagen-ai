import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { getGeminiApiKey } from "./env";

let client: ReturnType<typeof createGoogleGenerativeAI>;
let initError: Error | null = null;

function ensureClient() {
  if (initError) throw initError;
  if (!client) {
    try {
      client = createGoogleGenerativeAI({
        apiKey: getGeminiApiKey(),
      });
    } catch (e) {
      initError = e instanceof Error ? e : new Error(String(e));
      throw initError;
    }
  }
  return client;
}

function googleProvider(modelId: string) {
  return ensureClient()(modelId);
}

googleProvider.embedding = function (modelId: string) {
  return ensureClient().embedding(modelId);
};

export const google = googleProvider;
