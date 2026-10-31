import crypto from "crypto";
import path from "path";
import { config } from "dotenv";
import { getRedisClient } from "../lib/redis";
import { checkRateLimits } from "../lib/ratelimit";

const envPath = path.resolve(__dirname, "../.env.local");
config({ path: envPath, quiet: true });

function assert(condition: boolean, message: string): void {
  if (!condition) throw new RateLimitTestFailure(message);
  console.log(`PASS: ${message}`);
}

class RateLimitTestFailure extends Error {}

let currentTest = "Redis connectivity";

async function runRateLimitTests(): Promise<void> {
  const redis = getRedisClient();

  if (!redis) {
    console.error("RedisUnavailable");
    process.exitCode = 1;
    return;
  }
  try {
    await redis.ping();
  } catch (error: unknown) {
    console.error(error instanceof Error ? error.name : "UnknownError");
    process.exitCode = 1;
    return;
  }

  const testPrefix = `standupflow:ratelimit-test:${crypto.randomUUID()}`;
  const originalGlobalCap = process.env.GLOBAL_DAILY_CAP;
  let deletedKeyCount = 0;

  try {
    currentTest = "per-user limit";
    process.env.GLOBAL_DAILY_CAP = "1000";
    const userId = `${testPrefix}:minute-user`;
    const userCalls = [];
    for (let index = 0; index < 5; index++) {
      userCalls.push(
        await checkRateLimits({
          userId,
          clientIp: "203.0.113.1",
          keyPrefix: `${testPrefix}:minute`,
        })
      );
    }
    const sixthUserCall = await checkRateLimits({
      userId,
      clientIp: "203.0.113.1",
      keyPrefix: `${testPrefix}:minute`,
    });
    assert(
      userCalls.every((result) => result.success) &&
        !sixthUserCall.success &&
        /wait \d+s/.test(sixthUserCall.message ?? ""),
      "Per-user limit allows five requests and rejects the sixth with a retry time"
    );

    currentTest = "global daily cap";
    process.env.GLOBAL_DAILY_CAP = "2";
    const globalPrefix = `${testPrefix}:global`;
    const globalCalls = [];
    for (let index = 0; index < 3; index++) {
      globalCalls.push(
        await checkRateLimits({
          userId: `${testPrefix}:global-user-${index}`,
          clientIp: `203.0.113.${index + 2}`,
          keyPrefix: globalPrefix,
        })
      );
    }
    assert(
      globalCalls[0].success &&
        globalCalls[1].success &&
        !globalCalls[2].success &&
        globalCalls[2].isGlobalCap === true,
      "Global daily cap allows two configured requests and rejects the third"
    );

    currentTest = "per-IP daily cap";
    process.env.GLOBAL_DAILY_CAP = "1000";
    const ipPrefix = `${testPrefix}:ip`;
    const ipCalls = [];
    for (let index = 0; index < 40; index++) {
      ipCalls.push(
        await checkRateLimits({
          userId: `${testPrefix}:ip-user-${index}`,
          clientIp: "203.0.113.42",
          keyPrefix: ipPrefix,
        })
      );
    }
    const fortyFirstIpCall = await checkRateLimits({
      userId: `${testPrefix}:ip-user-40`,
      clientIp: "203.0.113.42",
      keyPrefix: ipPrefix,
    });
    assert(
      ipCalls.every((result) => result.success) && !fortyFirstIpCall.success,
      "Per-IP daily limit allows 40 requests and rejects the 41st"
    );
  } finally {
    if (originalGlobalCap === undefined) {
      delete process.env.GLOBAL_DAILY_CAP;
    } else {
      process.env.GLOBAL_DAILY_CAP = originalGlobalCap;
    }

    currentTest = "test-key cleanup";
    currentTest = "test-key cleanup";
    const testKeys = await redis.keys(`${testPrefix}*`);
    if (testKeys.length > 0) deletedKeyCount = await redis.del(...testKeys);
  }

  console.log(`PASS: Removed ${deletedKeyCount} isolated test keys`);
}

runRateLimitTests().catch((error: unknown) => {
  if (error instanceof RateLimitTestFailure) {
    console.error(`Rate-limit test failed: ${error.message}`);
    process.exitCode = 1;
    return;
  }
  const errorType = error instanceof Error ? error.name : "UnknownError";
  console.error(`Rate-limit test failed during ${currentTest} (${errorType}); details omitted.`);
  process.exitCode = 1;
});
