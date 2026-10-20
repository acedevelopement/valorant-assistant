import { invoke } from "@tauri-apps/api/core";

export async function registerHotkey(hotkey: string): Promise<void> {
  return invoke("register_hotkey", { hotkey });
}

// Capture keyboard input for the hotkey field
export function captureHotkey(
  e: React.KeyboardEvent,
  onCapture: (combo: string) => void
) {
  e.preventDefault();

  const parts: string[] = [];
  if (e.ctrlKey) parts.push("Ctrl");
  if (e.shiftKey) parts.push("Shift");
  if (e.altKey) parts.push("Alt");
  if (e.metaKey) parts.push("Win");

  const key = e.key;
  // Only capture letter keys, ignore modifiers alone
  if (key.length === 1 && /[a-zA-Z]/.test(key)) {
    parts.push(key.toUpperCase());
    if (parts.length >= 2) {
      onCapture(parts.join("+"));
    }
  }
}
