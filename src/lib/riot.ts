import { invoke } from "@tauri-apps/api/core";

export interface RiotSession {
  logged_in: boolean;
  puuid: string;
  game_name: string;
  tag_line: string;
  region: string;
}

export interface RankInfo {
  rank: string;
  rr: number | null;
  peak_rank: string | null;
}

export async function getRiotSession(): Promise<RiotSession> {
  return invoke<RiotSession>("get_riot_session");
}

export async function fetchRank(
  region: string,
  name: string,
  tag: string
): Promise<RankInfo> {
  return invoke<RankInfo>("get_rank", { region, name, tag });
}
