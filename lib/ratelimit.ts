import crypto from "crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { getRedisClient } from "./redis";

export function hashIp(ip: string): string {
  const secret = process.env.IP_HASH_SECRET || "fallback_standupflow_secret_salt_32984";
  return crypto.createHmac("sha256", secret).update(ip || "127.0.0.1").digest("hex");
}

export interface RateLimitResult {
  success: boolean;
  limit?: number;
  remaining?: number;
  reset?: number;
  message?: string;
  isGlobalCap?: boolean;
  serviceUnavailable?: boolean;
}

/**
 * Checks all rate limits:
 * 1. Global daily cap (Gemini quota protection)
 * 2. Per-user per-minute limit (5 req/min)
 * 3. Per-IP per-day limit (40 req/day)
 */
export async function checkRateLimits(params: {
  userId: string;
  clientIp: string;
  keyPrefix?: string;
}): Promise<RateLimitResult> {
  const { userId, clientIp } = params;
  const keyPrefix = params.keyPrefix ?? "ratelimit";
  const hashedIp = hashIp(clientIp);
  const globalCap = Number(process.env.GLOBAL_DAILY_CAP || 200);

  try {
    const redis = getRedisClient();
    if (!redis) {
      return {
        success: false,
        serviceUnavailable: true,
        message: "Rate limiting is temporarily unavailable. Please try again shortly.",
      };
    }

    // 1. Global Daily Cap check via Upstash
    const todayKey = `${keyPrefix}:global:${new Date().toISOString().slice(0, 10)}`;
    const currentGlobal = await redis.incr(todayKey);
    if (currentGlobal === 1) {
      await redis.expire(todayKey, 86400);
    }
    if (currentGlobal > globalCap) {
      return {
        success: false,
        isGlobalCap: true,
        message: "StandupFlow is resting for today. Please try again tomorrow.",
      };
    }

    // 2. User per-minute limit (5 requests per 60s sliding window)
    const userRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "60 s"),
      prefix: `${keyPrefix}:user`,
    });
    const userCheck = await userRatelimit.limit(userId);
    if (!userCheck.success) {
      const waitSec = Math.max(1, Math.ceil((userCheck.reset - Date.now()) / 1000));
      return {
        success: false,
        message: `Too many requests. Please wait ${waitSec}s before trying again.`,
      };
    }

    // 3. Loose per-IP daily limit (40 requests per 24h sliding window)
    const ipRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(40, "24 h"),
      prefix: `${keyPrefix}:ip`,
    });
    const ipCheck = await ipRatelimit.limit(hashedIp);
    if (!ipCheck.success) {
      return {
        success: false,
        message: "Daily request limit reached for this network. Please try again tomorrow.",
      };
    }

    return { success: true };
  } catch (err) {
    const errorName = err instanceof Error ? err.name : "UnknownError";
    console.error(`Rate-limit check failed (${errorName}).`);
    return {
      success: false,
      serviceUnavailable: true,
      message: "Rate limiting is temporarily unavailable. Please try again shortly.",
    };
  }
}
