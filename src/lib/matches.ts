import { invoke } from "@tauri-apps/api/core";

export interface MatchSummary {
  match_id: string;
  map: string;
  agent: string;
  result: string;
  kills: number;
  deaths: number;
  assists: number;
  acs: number;
  score_ally: number;
  score_enemy: number;
  queue: string;
  started_at: number;
}

export async function getMatches(count = 10): Promise<MatchSummary[]> {
  return invoke<MatchSummary[]>("get_matches", { count });
}
