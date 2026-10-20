import { start, stop, setActivity, clearActivity } from "tauri-plugin-drpc";
import { Activity, Assets, Timestamps } from "tauri-plugin-drpc/activity";

export const DISCORD_APP_ID = "1555666004757975114";
const LS_KEY = "vb_discord_rpc_enabled";

export function isRpcEnabled(): boolean {
  return localStorage.getItem(LS_KEY) === "true";
}

function buildActivity(state: string): Activity {
  const assets = new Assets()
    .setLargeImage("buddy")
    .setLargeText("Valorant Buddy");

  return new Activity()
    .setDetails("Valorant Buddy")
    .setState(state)
    .setAssets(assets)
    .setTimestamps(new Timestamps(Date.now()));
}

export async function enableRpc(state = "Browsing the app") {
  await start(DISCORD_APP_ID);
  await setActivity(buildActivity(state));
  localStorage.setItem(LS_KEY, "true");
}

export async function disableRpc() {
  try {
    await clearActivity();
  } catch {
    // ignore
  }
  try {
    await stop();
  } catch {
    // ignore
  }
  localStorage.setItem(LS_KEY, "false");
}

export async function updateRpcState(state: string) {
  if (!isRpcEnabled()) return;
  try {
    await setActivity(buildActivity(state));
  } catch (e) {
    console.error("[Discord RPC] update failed:", e);
  }
}
