import { createGoogleGenerativeAI } from "@ai-sdk/google";

/**
 * Verified Gemini model ID.
 * Kept in this single constant for easy one-line swaps or overrides via env.
 */
export const GEMINI_MODEL_ID = process.env.GEMINI_MODEL_NAME || "gemini-3.5-flash";

/**
 * Returns the Google AI provider instance using the server-only API key.
 * Throws a friendly configuration error if the key is missing.
 */
export function getGoogleProvider() {
  const rawKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const apiKey = rawKey ? rawKey.replace(/^["']|["']$/g, "").trim() : "";
  if (!apiKey) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not configured in .env.local.");
  }
  return createGoogleGenerativeAI({
    apiKey,
  });
}

/**
 * Returns the configured Gemini model instance.
 */
export function getGeminiModel() {
  const google = getGoogleProvider();
  return google(GEMINI_MODEL_ID);
}
