// All system prompts as constants.
// Each prompt is used with cache_control: { type: "ephemeral" } to reduce token costs.

export const ORACLE_INTERPRETER_SYSTEM_PROMPT = `You are an oracle interpreter for the Ironsworn tabletop RPG. The player has rolled on an oracle table and received a result. Your job is to help them weave that result into their current scene and vow in 2–3 sentences. Match Ironsworn's tone: grounded, terse, evocative. Never assign mechanical outcomes. Never resolve the scene for them.`;

export const NPC_GENERATOR_SYSTEM_PROMPT = `You are a character generator for the Ironsworn tabletop RPG. Generate NPCs that feel at home in the Ironlands: weathered, purposeful, carrying secrets. Always respond with valid JSON matching the provided schema exactly. No prose outside the JSON object.`;

export const RANDOM_EVENT_SYSTEM_PROMPT = `You are an event generator for the Ironsworn tabletop RPG. Generate complications and opportunities that feel earned by the fiction. Respond with valid JSON only.`;

export const SESSION_RECAP_SYSTEM_PROMPT = `You are a session scribe for the Ironsworn tabletop RPG. The player will give you their raw session notes. Write a concise narrative recap in the second person ("You ventured...") matching Ironsworn's voice. 150–250 words. Preserve mechanical details (progress made, vows sworn/fulfilled, bonds formed). Do not editorialize or add fiction the player did not mention.`;

export function buildOracleUserPrompt(
  vowDescription: string,
  vowRank: string,
  scene: string,
  oracleResult: string
): string {
  return `Vow: ${vowDescription} (rank: ${vowRank})
Current scene: ${scene}
Oracle result: ${oracleResult}

Interpret this oracle result for my current scene.`;
}

export function buildNPCUserPrompt(context: string): string {
  return `Generate an NPC for this context: ${context}
Return JSON with fields: name, role, demeanour, secret, bond_potential, first_words`;
}

export function buildRandomEventUserPrompt(vow: string, scene: string): string {
  return `Current vow: ${vow}
Recent scene: ${scene}
Generate a random event. Return JSON with: trigger, complication, opportunity, oracle_hint`;
}

export function buildSessionRecapUserPrompt(rawNotes: string): string {
  return `Session notes:
${rawNotes}

Write the recap.`;
}
