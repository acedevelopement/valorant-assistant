import { invoke } from "@tauri-apps/api/core";

export interface TournamentLink {
  label: string;
  url: string;
}

export interface LocalTournament {
  id: string;
  title: string;
  organizer: string;
  region: string;
  server: string;
  prize_pool: string;
  max_teams: number;
  registration_opens: string;
  registration_closes: string;
  start_time: string;
  duration_hours: number;
  description: string;
  links: TournamentLink[];
  banner_url: string | null;
}

export interface LoginResult {
  success: boolean;
  message: string;
}

export async function adminLogin(
  username: string,
  password: string
): Promise<LoginResult> {
  return invoke<LoginResult>("admin_login", { username, password });
}

export async function adminLogout(): Promise<void> {
  return invoke("admin_logout");
}

export async function adminIsAuthenticated(): Promise<boolean> {
  return invoke<boolean>("admin_is_authenticated");
}

export async function getLocalTournaments(): Promise<LocalTournament[]> {
  return invoke<LocalTournament[]>("get_local_tournaments");
}

export async function saveLocalTournaments(
  tournaments: LocalTournament[]
): Promise<void> {
  return invoke("save_local_tournaments", { tournaments });
}
