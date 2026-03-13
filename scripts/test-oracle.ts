/**
 * Stage 1 test harness — oracle interpreter.
 * Run with: npx tsx scripts/test-oracle.ts
 *
 * Requires ANTHROPIC_API_KEY in environment or a .env file in the project root.
 */

import "./load-env.js";
import { interpretOracle } from "../src/lib/ai/client.js";
import type { Vow } from "../src/lib/ironsworn/types.js";

const testVow: Vow = {
  id: "vow-1",
  description: "Find the source of the plague that is killing the ironlanders of Thornhaven.",
  rank: "Dangerous",
  progress: 2,
  swornAt: new Date().toISOString(),
};

const testScene =
  "You have followed the trails of the sick deep into the Hinterwood. The trees here grow close and the light fails early. A collapsed cairn marks an old crossroads.";

const testOracleResult = "Broken blood / Ancestor";

async function main() {
  console.log("=== Oracle Interpreter Test ===\n");
  console.log("Vow:           ", testVow.description);
  console.log("Rank:          ", testVow.rank);
  console.log("Scene:         ", testScene);
  console.log("Oracle result: ", testOracleResult);
  console.log("\n--- Sending request ---\n");

  const { interpretation, usage } = await interpretOracle(testVow, testScene, testOracleResult);

  console.log("Interpretation:\n");
  console.log(interpretation);
  console.log("\n--- Usage ---");
  console.log(JSON.stringify(usage, null, 2));
}

main().catch((err) => {
  console.error("Error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
