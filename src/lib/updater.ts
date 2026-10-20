import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export interface UpdateInfo {
  version: string;
  notes: string;
  date: string;
}

let pendingUpdate: Update | null = null;
let downloadedBytes = 0;
let totalBytes = 0;

export function getDownloadProgress(): { downloaded: number; total: number } {
  return { downloaded: downloadedBytes, total: totalBytes };
}

/**
 * Check for an update. Returns info about the update if one exists, or null.
 */
export async function checkForUpdate(): Promise<UpdateInfo | null> {
  try {
    const update = await check();
    if (!update) {
      return null;
    }

    pendingUpdate = update;

    return {
      version: update.version,
      notes: update.body ?? "",
      date: update.date ?? "",
    };
  } catch (e) {
    console.error("[Updater] check failed:", e);
    return null;
  }
}

/**
 * Download the pending update silently (no UI). Called automatically
 * after a check finds an update, so the bytes are ready before the
 * user sees the restart prompt.
 */
export async function downloadPendingUpdate(
  onProgress?: (downloaded: number, total: number) => void
): Promise<boolean> {
  if (!pendingUpdate) return false;

  try {
    downloadedBytes = 0;
    totalBytes = 0;

    await pendingUpdate.download((event) => {
      if (event.event === "Started") {
        totalBytes = event.data.contentLength ?? 0;
      } else if (event.event === "Progress") {
        downloadedBytes += event.data.chunkLength;
        onProgress?.(downloadedBytes, totalBytes);
      }
    });

    return true;
  } catch (e) {
    console.error("[Updater] download failed:", e);
    return false;
  }
}

/**
 * Install the pending update and relaunch the app.
 */
export async function installAndRelaunch(): Promise<void> {
  if (!pendingUpdate) return;

  try {
    await pendingUpdate.install();
    await relaunch();
  } catch (e) {
    console.error("[Updater] install failed:", e);
    throw e;
  }
}

export function hasPendingUpdate(): boolean {
  return pendingUpdate !== null;
}
