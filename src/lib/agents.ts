import { invoke } from "@tauri-apps/api/core";

export interface Ability {
  slot: string;
  display_name: string;
  description: string;
  display_icon: string;
}

export interface Agent {
  uuid: string;
  display_name: string;
  description: string;
  role: string;
  role_icon: string;
  display_icon: string;
  full_portrait: string;
  abilities: Ability[];
}

export async function getAgents(): Promise<Agent[]> {
  return invoke<Agent[]>("get_agents");
}
