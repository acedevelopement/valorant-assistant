export type TournamentStatus = "registering" | "upcoming" | "live" | "completed";

export interface TournamentLink {
  label: string;
  url: string;
}

export interface Tournament {
  id: string;
  title: string;
  organizer: string;
  region: string;
  server: string;
  prizePool: string;
  maxTeams: number;
  registrationOpens: string;  // ISO date
  registrationCloses: string; // ISO date
  startTime: string;          // ISO date
  durationHours: number;
  description: string;
  links: TournamentLink[];
  bannerUrl: string | null;
}

export const TOURNAMENTS: Tournament[] = [];
