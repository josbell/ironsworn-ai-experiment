/**
 * Cloudflare Worker — API proxy for Ironsworn AI companion.
 *
 * Routes:
 *   POST /oracle   — oracle interpretation (stage 1)
 *   POST /npc      — NPC generation (stage 2)
 *   POST /event    — random event generation (stage 2)
 *   POST /recap    — session recap (stage 3)
 *
 * Rate limiting: 20 AI requests per day per IP (free tier guard).
 */

import Anthropic from "@anthropic-ai/sdk";
import {
  ORACLE_INTERPRETER_SYSTEM_PROMPT,
  NPC_GENERATOR_SYSTEM_PROMPT,
  RANDOM_EVENT_SYSTEM_PROMPT,
  SESSION_RECAP_SYSTEM_PROMPT,
  buildOracleUserPrompt,
  buildNPCUserPrompt,
  buildRandomEventUserPrompt,
  buildSessionRecapUserPrompt,
} from "../lib/ai/prompts.js";
import { NPCSchema, RandomEventSchema, parseStructuredOutput } from "../lib/ai/schemas.js";

export interface Env {
  ANTHROPIC_API_KEY: string;
  /** KV namespace for rate limiting */
  RATE_LIMIT_KV: KVNamespace;
}

// claude-haiku-4-5-20251001 requires Anthropic API Tier 2 (~$40 spend).
// Use claude-3-5-haiku-20241022 on a fresh account; swap back once tier 2 is unlocked.
const MODEL = "claude-3-5-haiku-20241022";
const DAILY_LIMIT = 20;

// ---------------------------------------------------------------------------
// Rate limiting helpers
// ---------------------------------------------------------------------------

function getRateLimitKey(ip: string): string {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return `rl:${ip}:${today}`;
}

async function checkRateLimit(env: Env, ip: string): Promise<{ allowed: boolean; remaining: number }> {
  const key = getRateLimitKey(ip);
  const raw = await env.RATE_LIMIT_KV.get(key);
  const count = raw ? parseInt(raw, 10) : 0;

  if (count >= DAILY_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  // Increment, expire at midnight UTC (86400s max, KV doesn't align to calendar day
  // but it's close enough for a free-tier guard).
  const secondsUntilMidnight =
    86400 - (Math.floor(Date.now() / 1000) % 86400);
  await env.RATE_LIMIT_KV.put(key, String(count + 1), { expirationTtl: secondsUntilMidnight });

  return { allowed: true, remaining: DAILY_LIMIT - (count + 1) };
}

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function corsPreflightResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") return corsPreflightResponse();
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
    const { allowed, remaining } = await checkRateLimit(env, ip);
    if (!allowed) {
      return json({ error: "Daily AI request limit reached. Try again tomorrow." }, 429);
    }

    const url = new URL(request.url);
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    try {
      switch (url.pathname) {
        case "/oracle": {
          const { vowDescription, vowRank, scene, oracleResult } = body as {
            vowDescription: string;
            vowRank: string;
            scene: string;
            oracleResult: string;
          };
          const response = await client.messages.create({
            model: MODEL,
            max_tokens: 256,
            system: [{ type: "text", text: ORACLE_INTERPRETER_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
            messages: [{ role: "user", content: buildOracleUserPrompt(vowDescription, vowRank, scene, oracleResult) }],
          });
          const block = response.content[0];
          if (!block || block.type !== "text") throw new Error("Unexpected response shape");
          return json({ interpretation: block.text, usage: response.usage, remaining });
        }

        case "/npc": {
          const { context } = body as { context: string };
          const response = await client.messages.create({
            model: MODEL,
            max_tokens: 512,
            system: [{ type: "text", text: NPC_GENERATOR_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
            messages: [{ role: "user", content: buildNPCUserPrompt(context) }],
          });
          const block = response.content[0];
          if (!block || block.type !== "text") throw new Error("Unexpected response shape");
          const npc = parseStructuredOutput(NPCSchema, block.text);
          return json({ npc, usage: response.usage, remaining });
        }

        case "/event": {
          const { vow, scene } = body as { vow: string; scene: string };
          const response = await client.messages.create({
            model: MODEL,
            max_tokens: 512,
            system: [{ type: "text", text: RANDOM_EVENT_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
            messages: [{ role: "user", content: buildRandomEventUserPrompt(vow, scene) }],
          });
          const block = response.content[0];
          if (!block || block.type !== "text") throw new Error("Unexpected response shape");
          const event = parseStructuredOutput(RandomEventSchema, block.text);
          return json({ event, usage: response.usage, remaining });
        }

        case "/recap": {
          const { rawNotes } = body as { rawNotes: string };
          const response = await client.messages.create({
            model: MODEL,
            max_tokens: 512,
            system: [{ type: "text", text: SESSION_RECAP_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
            messages: [{ role: "user", content: buildSessionRecapUserPrompt(rawNotes) }],
          });
          const block = response.content[0];
          if (!block || block.type !== "text") throw new Error("Unexpected response shape");
          return json({ recap: block.text, usage: response.usage, remaining });
        }

        default:
          return json({ error: "Not found" }, 404);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[worker error]", message);
      return json({ error: message }, 500);
    }
  },
};
