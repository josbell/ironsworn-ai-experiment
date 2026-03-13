# Ironsworn AI Experiment

A solo/duo tabletop companion for the [Ironsworn RPG](https://www.ironswornrpg.com/), with configurable AI assistance. Built as a learning project for AI integration patterns — from simple oracle interpretation through to streaming session recaps.

## What it does

| Feature | Stage | Status |
|---|---|---|
| Oracle interpreter | 1 | scaffolded |
| NPC generator | 2 | scaffolded |
| Random event generator | 2 | scaffolded |
| Session recap (streaming UI) | 3 | scaffolded |

## Tech stack

- **Runtime**: Node.js + TypeScript (`npx tsx`)
- **AI**: Anthropic SDK — `claude-haiku-4-5-20251001`
- **Edge proxy**: Cloudflare Workers (rate limiting via KV)
- **Validation**: Zod
- **UI** *(stage 3)*: React + Vite + Tailwind + shadcn/ui
- **State** *(stage 3)*: Zustand
- **Local persistence** *(stage 3)*: Dexie.js (IndexedDB)

## Project structure

```
/
├── scripts/
│   ├── test-oracle.ts      # Stage 1 CLI harness
│   ├── test-npc.ts         # Stage 2 CLI harness
│   └── test-event.ts       # Stage 2 CLI harness
├── src/
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── client.ts   # Anthropic SDK wrapper
│   │   │   ├── prompts.ts  # System prompts + user prompt builders
│   │   │   └── schemas.ts  # Zod schemas for structured AI output
│   │   └── ironsworn/
│   │       └── types.ts    # Domain types (Vow, Bond, NPC, etc.)
│   └── worker/
│       └── index.ts        # Cloudflare Worker — API proxy + rate limiting
└── app/                    # React UI (stage 3, not yet scaffolded)
```

## Getting started

### Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)

### Install

```bash
npm install
```

### Run a test script

```bash
ANTHROPIC_API_KEY=sk-... npm run test:oracle
ANTHROPIC_API_KEY=sk-... npm run test:npc
ANTHROPIC_API_KEY=sk-... npm run test:event
```

Or copy `.env.example` to `.env` and add your key:

```bash
cp .env.example .env
# edit .env, then:
npx tsx scripts/test-oracle.ts
```

### Type check

```bash
npm run typecheck
```

## AI design notes

- **System prompt caching**: every request uses `cache_control: { type: "ephemeral" }` on the system prompt to reduce token costs on repeated calls.
- **Structured output**: NPC and event generators instruct the model to return JSON only, then validate the response against a Zod schema.
- **Rate limiting**: the Cloudflare Worker enforces 20 AI requests/day per IP using a KV namespace — a free-tier guard.
- **Token logging**: every call logs `input_tokens`, `output_tokens`, `cache_read_input_tokens`, and `cache_creation_input_tokens` during development.

## Ironsworn vocabulary

This codebase uses Ironsworn-specific terminology throughout. Key terms:

- **Vow** — a sworn quest with a rank (Troublesome → Epic) and a 0–10 progress track
- **Oracle** — a random table rolled for narrative input; results are evocative fragments
- **Oracle interpretation** — weaving an oracle result into the current scene and vow
- **Move** — a named action mechanic triggered by narrative action
- **Bond** — a relationship with an NPC or community, tracked on a progress track

## License

MIT
