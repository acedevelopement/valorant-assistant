export type AccentColor = "red" | "purple" | "blue" | "green" | "orange" | "cyan";

export const ACCENTS: Record<AccentColor, { accent: string; hover: string; dim: string; label: string }> = {
  red:    { accent: "#ff4655", hover: "#ff5e6b", dim: "#ff465520", label: "Red" },
  purple: { accent: "#a855f7", hover: "#b975f9", dim: "#a855f720", label: "Purple" },
  blue:   { accent: "#3b82f6", hover: "#5b98f8", dim: "#3b82f620", label: "Blue" },
  green:  { accent: "#22c55e", hover: "#3fdc78", dim: "#22c55e20", label: "Green" },
  orange: { accent: "#f97316", hover: "#fb8c34", dim: "#f9731620", label: "Orange" },
  cyan:   { accent: "#06b6d4", hover: "#22c7e3", dim: "#06b6d420", label: "Cyan" },
};

const KEYS = {
  accent: "vb_settings_accent",
  reduceMotion: "vb_settings_reduce_motion",
  hotkey: "vb_settings_hotkey",
};

export function getAccent(): AccentColor {
  const v = localStorage.getItem(KEYS.accent) as AccentColor | null;
  return v && v in ACCENTS ? v : "red";
}

export function setAccent(c: AccentColor) {
  localStorage.setItem(KEYS.accent, c);
  applyAccent(c);
}

export function applyAccent(c: AccentColor) {
  const a = ACCENTS[c];
  const root = document.documentElement;
  root.style.setProperty("--color-accent", a.accent);
  root.style.setProperty("--color-accent-hover", a.hover);
  root.style.setProperty("--color-accent-dim", a.dim);
}

export function getReduceMotion(): boolean {
  return localStorage.getItem(KEYS.reduceMotion) === "true";
}

export function setReduceMotion(v: boolean) {
  localStorage.setItem(KEYS.reduceMotion, v ? "true" : "false");
  applyReduceMotion(v);
}

export function applyReduceMotion(v: boolean) {
  if (v) {
    document.documentElement.classList.add("reduce-motion");
  } else {
    document.documentElement.classList.remove("reduce-motion");
  }
}

export function getHotkey(): string {
  return localStorage.getItem(KEYS.hotkey) ?? "Ctrl+B";
}

export function setHotkey(k: string) {
  localStorage.setItem(KEYS.hotkey, k);
}

export function applyAllSettings() {
  applyAccent(getAccent());
  applyReduceMotion(getReduceMotion());
}
