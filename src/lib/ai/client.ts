import Anthropic from "@anthropic-ai/sdk";
import type { Vow } from "../ironsworn/types.js";
import {
  ORACLE_INTERPRETER_SYSTEM_PROMPT,
  NPC_GENERATOR_SYSTEM_PROMPT,
  RANDOM_EVENT_SYSTEM_PROMPT,
  SESSION_RECAP_SYSTEM_PROMPT,
  buildOracleUserPrompt,
  buildNPCUserPrompt,
  buildRandomEventUserPrompt,
  buildSessionRecapUserPrompt,
} from "./prompts.js";
import { NPCSchema, RandomEventSchema, parseStructuredOutput } from "./schemas.js";
import type { NPC, RandomEvent } from "./schemas.js";

// claude-haiku-4-5-20251001 requires Anthropic API Tier 2 (~$40 spend).
// Use claude-3-5-haiku-20241022 on a fresh account; swap back once tier 2 is unlocked.
const MODEL = "claude-3-5-haiku-20241022";

function makeClient(apiKey?: string): Anthropic {
  return new Anthropic({ apiKey: apiKey ?? process.env["ANTHROPIC_API_KEY"] });
}

function logUsage(label: string, usage: Anthropic.Usage): void {
  console.log(`[${label}] tokens — input: ${usage.input_tokens}, output: ${usage.output_tokens}, cache_read: ${(usage as unknown as Record<string, number>)["cache_read_input_tokens"] ?? 0}, cache_creation: ${(usage as unknown as Record<string, number>)["cache_creation_input_tokens"] ?? 0}`);
}

/**
 * Stage 1 — oracle interpreter.
 * Returns a 2–3 sentence interpretation of the oracle result in context.
 */
export async function interpretOracle(
  vow: Vow,
  scene: string,
  oracleResult: string,
  apiKey?: string
): Promise<{ interpretation: string; usage: Anthropic.Usage }> {
  const client = makeClient(apiKey);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 256,
    system: [
      {
        type: "text",
        text: ORACLE_INTERPRETER_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: buildOracleUserPrompt(vow.description, vow.rank, scene, oracleResult),
      },
    ],
  });

  logUsage("oracle", response.usage);

  const block = response.content[0];
  if (!block || block.type !== "text") {
    throw new Error("Unexpected response format from oracle interpreter.");
  }

  return { interpretation: block.text, usage: response.usage };
}

/**
 * Stage 2 — NPC generator.
 * Returns a structured NPC object validated against NPCSchema.
 */
export async function generateNPC(context: string, apiKey?: string): Promise<{ npc: NPC; usage: Anthropic.Usage }> {
  const client = makeClient(apiKey);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: [
      {
        type: "text",
        text: NPC_GENERATOR_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: buildNPCUserPrompt(context),
      },
    ],
  });

  logUsage("npc", response.usage);

  const block = response.content[0];
  if (!block || block.type !== "text") {
    throw new Error("Unexpected response format from NPC generator.");
  }

  const npc = parseStructuredOutput(NPCSchema, block.text);
  return { npc, usage: response.usage };
}

/**
 * Stage 2 — random event generator.
 * Returns a structured event validated against RandomEventSchema.
 */
export async function generateRandomEvent(
  vow: Vow,
  scene: string,
  apiKey?: string
): Promise<{ event: RandomEvent; usage: Anthropic.Usage }> {
  const client = makeClient(apiKey);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: [
      {
        type: "text",
        text: RANDOM_EVENT_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: buildRandomEventUserPrompt(vow.description, scene),
      },
    ],
  });

  logUsage("event", response.usage);

  const block = response.content[0];
  if (!block || block.type !== "text") {
    throw new Error("Unexpected response format from random event generator.");
  }

  const event = parseStructuredOutput(RandomEventSchema, block.text);
  return { event, usage: response.usage };
}

/**
 * Stage 3 — session recap (non-streaming).
 * For the streaming variant used in the UI, use the Vercel AI SDK in app/.
 */
export async function generateSessionRecap(
  rawNotes: string,
  apiKey?: string
): Promise<{ recap: string; usage: Anthropic.Usage }> {
  const client = makeClient(apiKey);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: [
      {
        type: "text",
        text: SESSION_RECAP_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: buildSessionRecapUserPrompt(rawNotes),
      },
    ],
  });

  logUsage("recap", response.usage);

  const block = response.content[0];
  if (!block || block.type !== "text") {
    throw new Error("Unexpected response format from session recap generator.");
  }

  return { recap: block.text, usage: response.usage };
}
