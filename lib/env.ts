/**
 * Server-only environment variable validation and parsing utilities.
 * Ensures strict security: never prints, echoes, or logs secret values.
 */

export const REQUIRED_SERVER_VARIABLES = [
  "AUTH_SECRET",
  "IP_HASH_SECRET",
  "GOOGLE_GENERATIVE_AI_API_KEY",
  "AUTH_GOOGLE_ID",
  "AUTH_GOOGLE_SECRET",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
] as const;

/**
 * Server-side startup check.
 * Fails with a clear message naming any missing variable, NEVER its value.
 */
export function validateServerEnv(): { success: boolean; missing: string[] } {
  // Only execute in server-side nodejs runtime
  if (typeof window !== "undefined") {
    return { success: true, missing: [] };
  }

  const missing: string[] = [];

  for (const varName of REQUIRED_SERVER_VARIABLES) {
    const val = process.env[varName];
    if (!val || val.trim().length === 0) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    const msg = `[Startup Check Error] Missing required server environment variable(s): ${missing.join(
      ", "
    )}. Please configure them in .env.local.`;
    console.error(msg);
    throw new Error(msg);
  }

  return { success: true, missing: [] };
}

/**
 * Parse JUDGE_EMAILS safely:
 * - splits on commas
 * - trims whitespace
 * - converts to lowercase
 * - drops empty entries
 */
export function parseJudgeEmails(rawEnv?: string): string[] {
  const raw = rawEnv !== undefined ? rawEnv : process.env.JUDGE_EMAILS || "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Checks if a given email is a registered judge.
 * Compares strictly lowercased.
 */
export function isJudgeEmail(email?: string | null, rawEnv?: string): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const judges = parseJudgeEmails(rawEnv);
  return judges.includes(normalized);
}
