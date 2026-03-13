// Ironsworn domain types
// All terminology follows the Ironsworn rulebook conventions.

export type VowRank = "Troublesome" | "Dangerous" | "Formidable" | "Extreme" | "Epic";

export type ProgressValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface Vow {
  id: string;
  description: string;
  rank: VowRank;
  /** Progress track value 0–10 */
  progress: ProgressValue;
  /** ISO date string when the vow was sworn */
  swornAt: string;
  fulfilledAt?: string;
}

export interface Bond {
  id: string;
  /** NPC name or community name */
  name: string;
  description: string;
  progress: ProgressValue;
}

export interface OracleResult {
  table: string;
  result: string;
}

export interface OracleInterpretationRequest {
  vow: Vow;
  scene: string;
  oracleResult: OracleResult;
}

export interface OracleInterpretationResponse {
  interpretation: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheCreationTokens: number;
  };
}

export interface NPC {
  name: string;
  role: string;
  demeanour: string;
  secret: string;
  bond_potential: string;
  first_words: string;
}

export interface NPCGenerationRequest {
  context: string;
}

export interface RandomEvent {
  trigger: string;
  complication: string;
  opportunity: string;
  oracle_hint: string;
}

export interface RandomEventRequest {
  vow: Vow;
  scene: string;
}

export interface SessionRecapRequest {
  rawNotes: string;
}

export interface SessionRecapResponse {
  recap: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheCreationTokens: number;
  };
}
