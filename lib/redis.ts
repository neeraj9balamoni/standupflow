import { Redis } from "@upstash/redis";

/**
 * Global Redis client instance.
 * Returns null if Upstash credentials are not configured in environment.
 */
export function getRedisClient(): Redis | null {
  const rawUrl = process.env.UPSTASH_REDIS_REST_URL;
  const rawToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!rawUrl || !rawToken) {
    return null;
  }

  const url = rawUrl.replace(/^["']|["']$/g, "").trim();
  const token = rawToken.replace(/^["']|["']$/g, "").trim();

  if (!url || !token) {
    return null;
  }

  return new Redis({
    url,
    token,
  });
}
