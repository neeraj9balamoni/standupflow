import { z } from "zod";

export const GenerateRequestSchema = z.object({
  mode: z.enum(["generate", "regenerate", "tweak"]).default("generate"),
  done: z.string().min(1, "What did you work on is required."),
  blockers: z.string().optional().default(""),
  plans: z.string().optional().default(""),
  instruction: z.string().optional().default(""),
  previous: z
    .object({
      slack: z.string(),
      email: z.string(),
      short: z.string(),
    })
    .optional(),
});

export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedDone?: string;
  sanitizedBlockers?: string;
  sanitizedPlans?: string;
  sanitizedInstruction?: string;
}

export const NO_WORK_NOTES_MESSAGE =
  "That doesn't look like work notes. Tell me what you worked on.";

/**
 * Strips HTML tags and suspicious control characters while preserving plain text.
 */
export function sanitizeText(text: string): string {
  if (!text) return "";
  // Strip control chars (except normal tab, newline, carriage return)
  let clean = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  // Collapse excessive blank lines (more than 2 consecutive newlines)
  clean = clean.replace(/\n{3,}/g, "\n\n");
  return clean.trim();
}

/**
 * Checks for pasted code without over-blocking inline function and file names.
 */
export function detectPastedCodeOrMarkup(text: string): boolean {
  if (!text) return false;

  // HTML tags and javascript: URLs.
  if (/<\/?[a-z][^>]*>/i.test(text) || /javascript\s*:/i.test(text)) return true;

  // Markdown code fences.
  if (text.includes("```")) return true;

  // Lines ending in common code delimiters or consisting of closing delimiters.
  const lines = text.split(/\r?\n/);
  if (lines.some((line) => /[;{]\s*$/.test(line) || /^\s*(?:\}|\)|\];)\s*$/.test(line))) {
    return true;
  }

  // Code keywords paired with syntax delimiters indicate code, not inline names.
  const hasCodeKeyword =
    /\b(?:function|const|let|var|import|export|class|def|return)\b/i.test(text);
  if (hasCodeKeyword && /[()[\]{};=]/.test(text)) return true;

  // SQL statements are code even when they have no trailing semicolon.
  if (/\bSELECT\b[\s\S]*?\bFROM\b/i.test(text)) return true;

  // Multiple indented lines containing syntax symbols are likely a pasted block.
  const indentedCodeLines = lines.filter(
    (line) => /^[ \t]{2,}\S.*[{};=<>()[\]]/.test(line)
  );
  if (indentedCodeLines.length >= 2) return true;

  // Other recognizable multi-line programming constructs and shell commands.
  const codePatterns = [
    /^\s*(import\s+.+from\s+['"]|export\s+(default|const|function|class))/m,
    /^\s*(const|let|var)\s+[a-zA-Z0-9_$]+\s*=\s*(function|\([^)]*\)\s*=>|\{)/m,
    /^\s*return\s+\S+/m,
    /^\s*(public|private|protected)\s+(static\s+)?(async\s+)?[a-zA-Z0-9_$]+\s*\([^)]*\)\s*\{/m,
    /^\s*(INSERT\s+INTO|UPDATE\s+.+\s+SET|DELETE\s+FROM)\s+/im,
    /^\s*(curl\s+-X|chmod\s+\d+|chown\s+|sudo\s+rm\s+-rf)/m,
  ];

  for (const pattern of codePatterns) {
    if (pattern.test(text)) {
      return true;
    }
  }

  // 4. Symbol density check on substantial text (> 50 chars)
  // Symbols: { } ; < > = [ ] \ |
  // Developers normally use ~2-5% symbols even with function names like `foo()`.
  if (text.length > 50) {
    const codeSymbols = text.match(/[{};<>=[\]\\|]/g);
    if (codeSymbols && codeSymbols.length / text.length > 0.15) {
      return true;
    }
  }

  return false;
}

export function isInstructionOverride(text: string): boolean {
  return /\b(?:ignore|disregard|forget)\b.{0,60}\b(?:instructions?|rules?|prompt)\b/i.test(
    text
  );
}

/**
 * Validates the full standup submission against length and content constraints.
 */
export function validateStandupInput(data: {
  done: string;
  blockers?: string;
  plans?: string;
  instruction?: string;
}): ValidationResult {
  const sanitizedDone = sanitizeText(data.done);
  const sanitizedBlockers = sanitizeText(data.blockers || "");
  const sanitizedPlans = sanitizeText(data.plans || "");
  const sanitizedInstruction = sanitizeText(data.instruction || "");
  const fields = [
    sanitizedDone,
    sanitizedBlockers,
    sanitizedPlans,
    sanitizedInstruction,
  ];

  if (!sanitizedDone) {
    return {
      isValid: false,
      error: "Please describe what you worked on.",
    };
  }

  const totalLength =
    sanitizedDone.length +
    sanitizedBlockers.length +
    sanitizedPlans.length +
    sanitizedInstruction.length;

  if (totalLength > 1500) {
    return {
      isValid: false,
      error: "Input exceeds maximum limit of 1,500 characters. Please shorten your notes.",
    };
  }

  if (
    fields.some(detectPastedCodeOrMarkup) ||
    fields.some(isInstructionOverride)
  ) {
    return {
      isValid: false,
      error: fields.some(isInstructionOverride)
        ? NO_WORK_NOTES_MESSAGE
        : "Invalid input. Please describe your work in plain words.",
    };
  }

  return {
    isValid: true,
    sanitizedDone,
    sanitizedBlockers,
    sanitizedPlans,
    sanitizedInstruction,
  };
}

export function isWorkNotesRefusal(error: unknown): boolean {
  const parts: string[] = [];
  if (error instanceof Error) {
    parts.push(error.name, error.message);
    const cause = error.cause;
    if (cause instanceof Error) parts.push(cause.name, cause.message);
  } else if (typeof error === "string") {
    parts.push(error);
  }

  return /\b(?:refus(?:al|ed)|no usable work notes|doesn't look like work notes|couldn't find work notes|could not find work notes|can't help|cannot help|can't assist|cannot assist)\b/i.test(
    parts.join(" ")
  );
}

export function isNoWorkNotesOutput(output: {
  slack: string;
  email: string;
  short: string;
}): boolean {
  return isWorkNotesRefusal(
    `${output.slack}\n${output.email}\n${output.short}`
  );
}
