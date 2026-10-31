import { getRedisClient } from "./redis";
import { isJudgeEmail } from "./env";

// In-memory fallback for local development if Upstash keys are not yet configured
interface LocalTicketEntry {
  used: number;
  expiresAt: number;
}
const localTicketsStore = new Map<string, LocalTicketEntry>();

const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60;

export interface TicketStatus {
  allowed: boolean;
  ticketsLeft: number;
  ticketsTotal: number;
  resetInSeconds?: number;
}

/**
 * Calculates the total ticket allowance for a user.
 * 1. Checks Upstash per-user override: tickets:limit:{googleSub}
 * 2. Checks judge email list in env JUDGE_EMAILS
 * 3. Defaults to WEEKLY_TICKET_LIMIT (default 6)
 */
export async function getEffectiveTicketLimit(
  googleSub: string,
  userEmail?: string | null
): Promise<number> {
  const defaultLimit = Number(process.env.WEEKLY_TICKET_LIMIT || 6);
  const judgeLimit = Number(process.env.JUDGE_TICKET_LIMIT || 30);

  const redis = getRedisClient();

  if (redis) {
    try {
      const override = await redis.get<number>(`tickets:limit:${googleSub}`);
      if (override !== null && override !== undefined && !isNaN(Number(override))) {
        return Number(override);
      }
    } catch (err) {
      console.warn("Failed to read user ticket override from Redis:", err);
    }
  }

  if (isJudgeEmail(userEmail)) {
    return judgeLimit;
  }

  return defaultLimit;
}

/**
 * Checks ticket availability for the user without consuming any tickets.
 */
export async function checkTickets(
  googleSub: string,
  userEmail?: string | null
): Promise<TicketStatus> {
  const totalLimit = await getEffectiveTicketLimit(googleSub, userEmail);
  const redis = getRedisClient();

  if (!redis) {
    // In-memory dev fallback
    const entry = localTicketsStore.get(googleSub);
    const now = Date.now();
    if (!entry || entry.expiresAt <= now) {
      return {
        allowed: totalLimit > 0,
        ticketsLeft: totalLimit,
        ticketsTotal: totalLimit,
        resetInSeconds: SEVEN_DAYS_SECONDS,
      };
    }
    const ticketsLeft = Math.max(0, totalLimit - entry.used);
    return {
      allowed: ticketsLeft > 0,
      ticketsLeft,
      ticketsTotal: totalLimit,
      resetInSeconds: Math.max(0, Math.round((entry.expiresAt - now) / 1000)),
    };
  }

  try {
    const key = `tickets:used:${googleSub}`;
    const [usedRaw, ttl] = await Promise.all([
      redis.get<number>(key),
      redis.ttl(key),
    ]);

    const used = Number(usedRaw || 0);
    const ticketsLeft = Math.max(0, totalLimit - used);

    return {
      allowed: ticketsLeft > 0,
      ticketsLeft,
      ticketsTotal: totalLimit,
      resetInSeconds: ttl > 0 ? ttl : SEVEN_DAYS_SECONDS,
    };
  } catch (err) {
    console.error("Error reading tickets from Upstash Redis:", err);
    // Graceful fallback to allow request if Upstash has a transient error
    return {
      allowed: true,
      ticketsLeft: totalLimit,
      ticketsTotal: totalLimit,
      resetInSeconds: SEVEN_DAYS_SECONDS,
    };
  }
}

/**
 * Atomically consumes one ticket upon successful generation.
 * Sets a 7-day TTL on first use.
 */
export async function consumeTicket(
  googleSub: string,
  userEmail?: string | null
): Promise<{ ticketsLeft: number; ticketsTotal: number }> {
  const totalLimit = await getEffectiveTicketLimit(googleSub, userEmail);
  const redis = getRedisClient();

  if (!redis) {
    // In-memory dev fallback
    const now = Date.now();
    let entry = localTicketsStore.get(googleSub);
    if (!entry || entry.expiresAt <= now) {
      entry = { used: 1, expiresAt: now + SEVEN_DAYS_SECONDS * 1000 };
    } else {
      entry.used += 1;
    }
    localTicketsStore.set(googleSub, entry);
    return {
      ticketsLeft: Math.max(0, totalLimit - entry.used),
      ticketsTotal: totalLimit,
    };
  }

  try {
    const key = `tickets:used:${googleSub}`;
    // Atomically increment
    const newUsed = await redis.incr(key);

    // Set expiry on first use, or repair a key that has lost its TTL.
    if (newUsed === 1 || (await redis.ttl(key)) === -1) {
      await redis.expire(key, SEVEN_DAYS_SECONDS);
    }

    return {
      ticketsLeft: Math.max(0, totalLimit - newUsed),
      ticketsTotal: totalLimit,
    };
  } catch (err) {
    console.error("Error consuming ticket in Upstash Redis:", err);
    return {
      ticketsLeft: Math.max(0, totalLimit - 1),
      ticketsTotal: totalLimit,
    };
  }
}
