import "server-only";

export function getGeminiApiKey(): string {
  const rawValue = process.env.GEMINI_API_KEY;

  if (!rawValue) {
    throw new Error("Gemini API configuration is missing.");
  }

  if (rawValue.includes("\n") || rawValue.includes("\r")) {
    throw new Error(
      "Gemini API configuration is invalid. Check the server environment variable."
    );
  }

  const value = rawValue.trim();

  if (value.includes(" ")) {
    throw new Error(
      "Gemini API configuration is invalid. Check the server environment variable."
    );
  }

  return value;
}
