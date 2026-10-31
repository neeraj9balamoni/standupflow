/**
 * Next.js Instrumentation Hook
 * Executes server startup check to validate all required environment variables.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateServerEnv } = await import("./lib/env");
    validateServerEnv();
  }
}
