import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { auth } from "@/lib/auth";
import { getGeminiModel } from "@/lib/gemini";
import { SYSTEM_PROMPT, OutputSchema, buildUserPrompt } from "@/lib/prompt";
import {
  GenerateRequestSchema,
  isNoWorkNotesOutput,
  isWorkNotesRefusal,
  NO_WORK_NOTES_MESSAGE,
  validateStandupInput,
} from "@/lib/validation";
import { checkRateLimits } from "@/lib/ratelimit";
import { checkTickets, consumeTicket } from "@/lib/tickets";
import { validateServerEnv } from "@/lib/env";

export async function POST(req: NextRequest) {
  try {
    // 0. Server startup & environment validation
    try {
      validateServerEnv();
    } catch (envErr: unknown) {
      const msg = envErr instanceof Error ? envErr.message : "Missing server configuration.";
      return NextResponse.json(
        { error: { code: "CONFIGURATION_ERROR", message: msg } },
        { status: 500 }
      );
    }

    // 1. Session verification (server-side)
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Please sign in with Google to generate standups." } },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userEmail = session.user.email;

    // 2. Origin check (CSRF defense)
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    if (origin && host) {
      try {
        const originUrl = new URL(origin);
        // Allow matching host or matching configured AUTH_URL host
        const authHost = process.env.AUTH_URL ? new URL(process.env.AUTH_URL).host : null;
        if (originUrl.host !== host && (!authHost || originUrl.host !== authHost)) {
          return NextResponse.json(
            { error: { code: "FORBIDDEN", message: "Cross-site request blocked." } },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: { code: "FORBIDDEN", message: "Invalid Origin header." } },
          { status: 403 }
        );
      }
    }

    // 3. Parse JSON request body with Zod
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Malformed JSON request body." } },
        { status: 400 }
      );
    }

    const parseResult = GenerateRequestSchema.safeParse(body);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0]?.message || "Invalid input parameters.";
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: firstIssue } },
        { status: 400 }
      );
    }

    const requestData = parseResult.data;

    // 4. Sanitize and validate (length, markup, pasted code detection)
    const validation = validateStandupInput({
      done: requestData.done,
      blockers: requestData.blockers,
      plans: requestData.plans,
      instruction: requestData.instruction,
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", message: validation.error || "Invalid input." } },
        { status: 400 }
      );
    }

    // 5. Rate limits (per-user, per-IP backstop, global daily cap)
    const forwarded = req.headers.get("x-forwarded-for");
    const clientIp = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

    const rateLimitCheck = await checkRateLimits({
      userId,
      clientIp,
    });

    if (rateLimitCheck.serviceUnavailable) {
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMIT_UNAVAILABLE",
            message:
              rateLimitCheck.message ||
              "Rate limiting is temporarily unavailable. Please try again shortly.",
          },
        },
        { status: 503 }
      );
    }

    if (!rateLimitCheck.success) {
      return NextResponse.json(
        {
          error: {
            code: rateLimitCheck.isGlobalCap ? "GLOBAL_CAP_REACHED" : "RATE_LIMITED",
            message: rateLimitCheck.message || "Too many requests. Please wait before trying again.",
          },
        },
        { status: 429 }
      );
    }

    // 6. Check weekly tickets remaining
    const ticketStatus = await checkTickets(userId, userEmail);
    if (!ticketStatus.allowed || ticketStatus.ticketsLeft <= 0) {
      return NextResponse.json(
        {
          error: {
            code: "NO_TICKETS",
            message: "You have used all tickets for this week.",
          },
          ticketsLeft: 0,
          ticketsTotal: ticketStatus.ticketsTotal,
          resetInSeconds: ticketStatus.resetInSeconds,
        },
        { status: 403 }
      );
    }

    // 7. Call Gemini model
    const userPrompt = buildUserPrompt({
      done: validation.sanitizedDone!,
      blockers: validation.sanitizedBlockers,
      plans: validation.sanitizedPlans,
      mode: requestData.mode,
      instruction: validation.sanitizedInstruction,
      previous: requestData.previous,
    });

    const temperature = requestData.mode === "regenerate" ? 0.65 : 0.4;

    let aiResult;
    try {
      const model = getGeminiModel();
      aiResult = await generateObject({
        model,
        schema: OutputSchema,
        system: SYSTEM_PROMPT,
        prompt: userPrompt,
        temperature,
      });
    } catch (firstErr) {
      if (isWorkNotesRefusal(firstErr)) {
        return NextResponse.json(
          {
            error: {
              code: "NO_WORK_NOTES",
              message: NO_WORK_NOTES_MESSAGE,
            },
          },
          { status: 422 }
        );
      }
      console.warn("First Gemini attempt failed, retrying once...", firstErr);
      // Retry once gracefully as specified in Section 8 rule 8
      try {
        const model = getGeminiModel();
        aiResult = await generateObject({
          model,
          schema: OutputSchema,
          system: SYSTEM_PROMPT,
          prompt: userPrompt,
          temperature,
        });
      } catch (retryErr) {
        if (isWorkNotesRefusal(retryErr)) {
          return NextResponse.json(
            {
              error: {
                code: "NO_WORK_NOTES",
                message: NO_WORK_NOTES_MESSAGE,
              },
            },
            { status: 422 }
          );
        }
        console.error("Gemini call failed after retry:", retryErr);
        // Fail gracefully without consuming any ticket
        return NextResponse.json(
          {
            error: {
              code: "AI_GENERATION_FAILED",
              message:
                "Unable to generate standup at this moment. No tickets were consumed. Please try again.",
            },
          },
          { status: 502 }
        );
      }
    }

    // Validate the model output against schema
    const outputValidation = OutputSchema.safeParse(aiResult.object);
    if (!outputValidation.success) {
      console.error("AI output failed schema validation:", outputValidation.error);
      return NextResponse.json(
        {
          error: {
            code: "AI_OUTPUT_INVALID",
            message: "Standup generation output was malformed. No tickets were consumed.",
          },
        },
        { status: 502 }
      );
    }

    if (isNoWorkNotesOutput(outputValidation.data)) {
      return NextResponse.json(
        {
          error: {
            code: "NO_WORK_NOTES",
            message: NO_WORK_NOTES_MESSAGE,
          },
        },
        { status: 422 }
      );
    }

    // 8. Consume one ticket on success
    const updatedTickets = await consumeTicket(userId, userEmail);

    return NextResponse.json({
      data: outputValidation.data,
      ticketsLeft: updatedTickets.ticketsLeft,
      ticketsTotal: updatedTickets.ticketsTotal,
    });
  } catch (err) {
    console.error("Unhandled error in /api/generate:", err);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred. Please try again shortly.",
        },
      },
      { status: 500 }
    );
  }
}
