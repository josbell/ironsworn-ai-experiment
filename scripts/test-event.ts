/**
 * Stage 2 test harness — random event generator.
 * Run with: npx tsx scripts/test-event.ts
 *
 * Requires ANTHROPIC_API_KEY in environment (or a .env file loaded externally).
 */

import { generateRandomEvent } from "../src/lib/ai/client.js";
import type { Vow } from "../src/lib/ironsworn/types.js";

const testVow: Vow = {
  id: "vow-1",
  description: "Find the source of the plague that is killing the ironlanders of Thornhaven.",
  rank: "Dangerous",
  progress: 3,
  swornAt: new Date().toISOString(),
};

const testScene =
  "You have just spoken with the gate-warden and learned that three healers sent into the town have not returned. Night is falling. You must decide whether to enter before the gates close.";

async function main() {
  console.log("=== Random Event Generator Test ===\n");
  console.log("Vow:  ", testVow.description);
  console.log("Scene:", testScene);
  console.log("\n--- Sending request ---\n");

  const { event, usage } = await generateRandomEvent(testVow, testScene);

  console.log("Generated Event:\n");
  console.log(JSON.stringify(event, null, 2));
  console.log("\n--- Usage ---");
  console.log(JSON.stringify(usage, null, 2));
}

main().catch((err) => {
  console.error("Error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
