import { LINEUPS, type Lineup, type Difficulty } from "../data/lineups";

export function getLineupById(id: string): Lineup | undefined {
  return LINEUPS.find((l) => l.id === id);
}

// Favorites via localStorage
const FAV_KEY = "vb_lineup_favorites";

export function getFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleFavorite(id: string): string[] {
  const current = getFavorites();
  const next = current.includes(id)
    ? current.filter((f) => f !== id)
    : [...current, id];
  localStorage.setItem(FAV_KEY, JSON.stringify(next));
  return next;
}

export const difficultyColor: Record<Difficulty, string> = {
  easy: "text-win",
  medium: "text-yellow-400",
  hard: "text-loss",
};
