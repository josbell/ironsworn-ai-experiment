# Ironsworn AI companion — project context

## What this is

A solo/duo tabletop companion app for Ironsworn RPG with configurable AI assistance
modes. The long-term vision is a spectrum from pure session tracking through to full
AI DM, but the current focus is stages 1–3 of the AI integration learning path only.

## Current build stage

Stage 1 → Stage 3. Do not suggest features or architecture beyond stage 3 unless
explicitly asked. The goal right now is learning AI integration patterns, not
building a complete product.

### Stage 1 — oracle interpreter (complete when checked)

- [ ] Edge function proxying Anthropic API key (Cloudflare Worker or Vercel Edge)
- [ ] Single-shot prompt: oracle result + current vow + scene → narrative interpretation
- [ ] `scripts/test-oracle.ts` script runnable with `npx tsx`
- [ ] Error handling: API errors, rate limits, malformed responses

### Stage 2 — NPC + event generator (complete when checked)

- [ ] Zod schema for NPC output (name, demeanour, secret, bond, role)
- [ ] Zod schema for random event output (trigger, complication, opportunity)
- [ ] Structured JSON output enforced via system prompt + schema validation
- [ ] Per-user rate limiting on edge function (20 AI requests / day free tier)
- [ ] `scripts/test-npc.ts` and `scripts/test-event.ts`

### Stage 3 — session recap + minimal UI (complete when checked)

- [ ] Vite + React scaffold (`/app`)
- [ ] Streaming response via SSE rendered in browser
- [ ] Zustand store for session notes + recap state
- [ ] Dexie (IndexedDB) storing recaps locally — no backend, no auth
- [ ] Single page: textarea for notes → stream recap → save to local history

## Tech stack

- Runtime: Node.js + TypeScript (`npx tsx` for scripts)
- AI: Anthropic SDK (`@anthropic-ai/sdk`) — model `claude-haiku-4-5-20251001`
- Edge proxy: Cloudflare Workers (preferred) or Vercel Edge Functions
- Validation: Zod
- UI (stage 3+): React + Vite + Tailwind + shadcn/ui
- State (stage 3+): Zustand
- Local persistence (stage 3+): Dexie.js (IndexedDB wrapper)
- AI streaming (stage 3+): Vercel AI SDK

## Ironsworn domain vocabulary

Always use Ironsworn-specific terminology correctly in prompts and code:

- **Move**: a named action mechanic (e.g. "Swear an Iron Vow", "Face Danger",
  "Strike"). Moves are triggered by narrative action, not chosen from a menu.
- **Vow**: a sworn quest the character must fulfil. Has a rank (Troublesome →
  Epic) and a progress track (0–10).
- **Progress track**: a 0–10 track marking advancement toward a vow, bond, or
  challenge. Each box can be partially or fully filled.
- **Oracle**: a random table the player rolls on when they need narrative input
  from the fiction. Results are evocative fragments, not instructions.
- **Oracle interpretation**: the creative act of weaving an oracle result into
  the current scene and vow. This is what the AI helps with.
- **Momentum**: a stat (−6 to +10) that rises with successes and falls with
  setbacks. Can be "burned" to replace an action roll result.
- **Bonds**: relationships with NPCs or communities. Have their own progress track.
- **Delve**: a structured exploration of a dangerous site (from the Delve
  expansion). Has its own progress mechanics and theme/domain tables.
- **Denizen**: an NPC or creature inhabiting a delve site.
- **Stronghold**: a base of operations the character can develop.
- **Ironlands**: the default setting — Norse-inspired, low magic, frontier.

## System prompt guidelines

The Ironsworn system prompt (cached across all requests) must:

1. Ground Claude in the Ironsworn worldview: grim, grounded, low magic, meaningful vows
2. Use move/vow/oracle terminology correctly — never say "quest objective" or "mission"
3. Keep interpretations to 2–4 sentences — players are mid-session, not reading prose
4. Never invent mechanical outcomes (e.g. "you gain +1 momentum") — that's the player's job
5. Never railroad the narrative — offer possibilities, not conclusions
6. Match the tone: terse, evocative, Nordic. Not heroic fantasy, not grimdark.

## Prompt patterns

### Oracle interpreter (stage 1)

```
System (cached):
You are an oracle interpreter for the Ironsworn tabletop RPG. The player has rolled
on an oracle table and received a result. Your job is to help them weave that result
into their current scene and vow in 2–3 sentences. Match Ironsworn's tone: grounded,
terse, evocative. Never assign mechanical outcomes. Never resolve the scene for them.

User:
Vow: {vow_description} (rank: {rank})
Current scene: {scene_description}
Oracle result: {oracle_result}

Interpret this oracle result for my current scene.
```

### NPC generator (stage 2)

```
System (cached):
You are a character generator for the Ironsworn tabletop RPG. Generate NPCs that
feel at home in the Ironlands: weathered, purposeful, carrying secrets. Always
respond with valid JSON matching the provided schema exactly. No prose outside
the JSON object.

User:
Generate an NPC for this context: {context}
Return JSON with fields: name, role, demeanour, secret, bond_potential, first_words
```

### Random event (stage 2)

```
System (cached):
You are an event generator for the Ironsworn tabletop RPG. Generate complications
and opportunities that feel earned by the fiction. Respond with valid JSON only.

User:
Current vow: {vow}
Recent scene: {scene}
Generate a random event. Return JSON with: trigger, complication, opportunity, oracle_hint
```

### Session recap (stage 3)

```
System (cached):
You are a session scribe for the Ironsworn tabletop RPG. The player will give you
their raw session notes. Write a concise narrative recap in the second person ("You
ventured...") matching Ironsworn's voice. 150–250 words. Preserve mechanical details
(progress made, vows sworn/fulfilled, bonds formed). Do not editorialize or add
fiction the player did not mention.

User:
Session notes:
{raw_notes}

Write the recap.
```

## File structure (current)

```
/
├── CLAUDE.md               ← this file
├── scripts/
│   ├── test-oracle.ts      ← stage 1 test harness
│   ├── test-npc.ts         ← stage 2 test harness
│   └── test-event.ts       ← stage 2 test harness
├── src/
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── client.ts       ← Anthropic SDK wrapper
│   │   │   ├── prompts.ts      ← all system prompts as constants
│   │   │   └── schemas.ts      ← Zod schemas for structured output
│   │   └── ironsworn/
│   │       └── types.ts        ← Ironsworn domain types (Vow, Move, Oracle, etc.)
│   └── worker/
│       └── index.ts            ← edge function (Cloudflare Worker)
├── app/                    ← React UI (scaffold at stage 3)
├── package.json
└── tsconfig.json
```

## Constraints — do not suggest unless asked

- No database or backend beyond the edge function proxy
- No auth or user accounts
- No full AI DM mode (stage 5)
- No Starforged or other system support yet
- No React Native, Capacitor, or Tauri
- No monetisation or credit system
- No deployment configuration beyond local dev + edge function

## Cost guardrails

- Default model: `claude-haiku-4-5-20251001` for all stages 1–3
- Always cache the system prompt using `cache_control: { type: "ephemeral" }`
- Set a hard spend limit of $10/month in the Anthropic dashboard during development
- Log token usage on every response during dev: `response.usage`
- Scripts must never loop or batch more than 5 requests without a manual confirm prompt

## Key decisions already made

- Ironsworn-first, generic later: build for Ironsworn vocabulary now, store
  game-specific content in JSON config files so adding Starforged later is a
  config swap not a rewrite
- AI assist modes only for now: not building a full AI DM, just tools that
  help a human player interpret oracles, generate NPCs, and recap sessions
- Local-first data: no cloud sync, no accounts, IndexedDB only for stage 3
- CLI scripts before UI: stages 1–2 are TypeScript scripts, UI arrives at stage 3
