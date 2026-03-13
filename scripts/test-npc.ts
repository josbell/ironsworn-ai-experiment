/**
 * Stage 2 test harness — NPC generator.
 * Run with: npx tsx scripts/test-npc.ts
 *
 * Requires ANTHROPIC_API_KEY in environment or a .env file in the project root.
 */

import "./load-env.js";
import { generateNPC } from "../src/lib/ai/client.js";

const testContext =
  "A disgraced former ironsworn warrior who guards the gates of Thornhaven. She lost her sworn vow when her ward died, and carries a broken sword as penance. The player needs passage into the quarantined town.";

async function main() {
  console.log("=== NPC Generator Test ===\n");
  console.log("Context:", testContext);
  console.log("\n--- Sending request ---\n");

  const { npc, usage } = await generateNPC(testContext);

  console.log("Generated NPC:\n");
  console.log(JSON.stringify(npc, null, 2));
  console.log("\n--- Usage ---");
  console.log(JSON.stringify(usage, null, 2));
}

main().catch((err) => {
  console.error("Error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
