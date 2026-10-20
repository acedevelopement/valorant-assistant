import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

export type Region = "eu" | "na" | "ap" | "kr" | "br" | "latam";

export interface RankInfo {
  rank: string;
  rr: number | null;
  raw: string;
  iconUrl: string | null;
}

// Test mapping — only Diamond 2 for now
const RANK_ICONS: Record<string, string> = {
  "diamond 2":
    "https://svgstack.com/media/img/valorant-diamond-2-icon-gPni155245.webp",
};

export async function fetchRank(
  region: Region,
  name: string,
  tag: string
): Promise<RankInfo> {
  const url = `https://api.kyroskoh.xyz/valorant/v1/mmr/${region}/${encodeURIComponent(
    name
  )}/${encodeURIComponent(tag)}?show=combo&display=0`;

  const res = await tauriFetch(url, { method: "GET" });
  if (!res.ok) throw new Error(`API error: ${res.status}`);

  const text = (await res.text()).trim();

  const match = text.match(/^(.+?)\s*[:\-]\s*(\d+)?\s*RR/i);
  let rankName = text;
  let rr: number | null = null;

  if (match) {
    rankName = match[1].trim();
    rr = match[2] ? parseInt(match[2], 10) : null;
  }

  rankName = rankName.replace(/\s*\(.*?\)\s*$/, "").trim();

  const iconUrl = RANK_ICONS[rankName.toLowerCase()] ?? null;

  return { rank: rankName, rr, raw: text, iconUrl };
}
