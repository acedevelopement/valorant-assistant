import { invoke } from "@tauri-apps/api/core";

export async function clearCache(): Promise<string> {
  return invoke<string>("clear_cache");
}
