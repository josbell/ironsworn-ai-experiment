import { z } from "zod";

// Stage 2: Zod schemas for structured JSON output from the AI.
// These are used both for runtime validation and as TypeScript types via z.infer.

export const NPCSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  demeanour: z.string().min(1),
  secret: z.string().min(1),
  bond_potential: z.string().min(1),
  first_words: z.string().min(1),
});

export type NPC = z.infer<typeof NPCSchema>;

export const RandomEventSchema = z.object({
  trigger: z.string().min(1),
  complication: z.string().min(1),
  opportunity: z.string().min(1),
  oracle_hint: z.string().min(1),
});

export type RandomEvent = z.infer<typeof RandomEventSchema>;

/**
 * Parses a raw AI response string as JSON, then validates it against the
 * provided Zod schema. Throws a descriptive error on failure.
 */
export function parseStructuredOutput<T>(schema: z.ZodType<T>, raw: string): T {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`AI response was not valid JSON.\n\nRaw response:\n${raw}`);
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `AI response did not match expected schema.\n\nErrors:\n${result.error.message}\n\nRaw response:\n${raw}`
    );
  }

  return result.data;
}
