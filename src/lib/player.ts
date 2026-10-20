import { invoke } from "@tauri-apps/api/core";

export interface PlayerMatch {
  match_id: string;
  map: string;
  mode: string;
  agent: string;
  kills: number;
  deaths: number;
  assists: number;
  score_ally: number;
  score_enemy: number;
  result: string;
  started_at: number;
}

export interface MatchPlayer {
  name: string;
  tag: string;
  agent: string;
  team: string;
  kills: number;
  deaths: number;
  assists: number;
  is_subject: boolean;
}

export interface RoundInfo {
  round_num: number;
  winning_team: string;
}

export interface MatchDetail {
  match_id: string;
  map: string;
  mode: string;
  rounds: RoundInfo[];
  players: MatchPlayer[];
  subject_team: string;
}

export interface PlayerRank {
  rank: string;
  rr: number | null;
  peak_rank: string | null;
}

export type MatchMode = "all" | "competitive" | "unrated" | "deathmatch" | "custom";

export async function getPlayerRank(
  region: string,
  name: string,
  tag: string
): Promise<PlayerRank> {
  return invoke<PlayerRank>("get_player_rank", { region, name, tag });
}

export async function getPlayerMatches(
  region: string,
  name: string,
  tag: string,
  size = 10,
  mode: MatchMode = "all"
): Promise<PlayerMatch[]> {
  const modeArg = mode === "all" ? null : mode;
  return invoke<PlayerMatch[]>("get_player_matches", {
    region,
    name,
    tag,
    size,
    mode: modeArg,
  });
}

export async function getMatchDetail(
  region: string,
  matchId: string,
  subjectName: string,
  subjectTag: string
): Promise<MatchDetail> {
  return invoke<MatchDetail>("get_match_detail", {
    region,
    matchId,
    subjectName,
    subjectTag,
  });
}

export async function getMatchRanks(
  region: string,
  players: string[]
): Promise<Record<string, string>> {
  return invoke<Record<string, string>>("get_match_ranks", { region, players });
}

export const RANK_ICONS: Record<string, string> = {
  "iron 1":      "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/3/largeicon.png",
  "iron 2":      "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/4/largeicon.png",
  "iron 3":      "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/5/largeicon.png",
  "bronze 1":    "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/6/largeicon.png",
  "bronze 2":    "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/7/largeicon.png",
  "bronze 3":    "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/8/largeicon.png",
  "silver 1":    "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/9/largeicon.png",
  "silver 2":    "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/10/largeicon.png",
  "silver 3":    "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/11/largeicon.png",
  "gold 1":      "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/12/largeicon.png",
  "gold 2":      "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/13/largeicon.png",
  "gold 3":      "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/14/largeicon.png",
  "platinum 1":  "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/15/largeicon.png",
  "platinum 2":  "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/16/largeicon.png",
  "platinum 3":  "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/17/largeicon.png",
  "diamond 1":   "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/18/largeicon.png",
  "diamond 2":   "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/19/largeicon.png",
  "diamond 3":   "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/20/largeicon.png",
  "ascendant 1": "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/21/largeicon.png",
  "ascendant 2": "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/22/largeicon.png",
  "ascendant 3": "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/23/largeicon.png",
  "immortal 1":  "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/24/largeicon.png",
  "immortal 2":  "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/25/largeicon.png",
  "immortal 3":  "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/26/largeicon.png",
  "radiant":     "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/27/largeicon.png",
  "unranked":    "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/0/largeicon.png",
};
