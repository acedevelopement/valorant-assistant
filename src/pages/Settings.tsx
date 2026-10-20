import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Palette, Keyboard, MessageCircle, Zap, Trash2 } from "lucide-react";
import { isRpcEnabled, enableRpc, disableRpc } from "../lib/discordRpc";
import {
  ACCENTS,
  getAccent,
  setAccent,
  getReduceMotion,
  setReduceMotion,
  getHotkey,
  setHotkey,
  type AccentColor,
} from "../lib/settings";
import { registerHotkey, captureHotkey } from "../lib/hotkey";
import { clearCache } from "../lib/cache";

export default function Settings() {
  const [rpcEnabled, setRpcEnabled] = useState(false);
  const [rpcBusy, setRpcBusy] = useState(false);
  const [rpcMessage, setRpcMessage] = useState<string | null>(null);

  const [accent, setAccentState] = useState<AccentColor>("red");
  const [reduceMotion, setReduceMotionState] = useState(false);

  const [hotkey, setHotkeyState] = useState("Ctrl+B");
  const [capturing, setCapturing] = useState(false);
  const [hotkeyMsg, setHotkeyMsg] = useState<string | null>(null);
  const hotkeyInputRef = useRef<HTMLDivElement>(null);

  const [cacheMsg, setCacheMsg] = useState<string | null>(null);
  const [cacheBusy, setCacheBusy] = useState(false);

  useEffect(() => {
    setRpcEnabled(isRpcEnabled());
    setAccentState(getAccent());
    setReduceMotionState(getReduceMotion());
    setHotkeyState(getHotkey());
  }, []);

  const toggleRpc = async () => {
    setRpcBusy(true);
    setRpcMessage(null);
    try {
      if (rpcEnabled) {
        await disableRpc();
        setRpcEnabled(false);
        setRpcMessage("Disabled.");
      } else {
        await enableRpc("In Settings");
        setRpcEnabled(true);
        setRpcMessage("Enabled.");
      }
    } catch (e) {
      setRpcMessage(String(e));
    } finally {
      setRpcBusy(false);
      setTimeout(() => setRpcMessage(null), 2500);
    }
  };

  const changeAccent = (c: AccentColor) => {
    setAccentState(c);
    setAccent(c);
  };

  const toggleMotion = () => {
    const next = !reduceMotion;
    setReduceMotionState(next);
    setReduceMotion(next);
  };

  const startCapture = () => {
    setCapturing(true);
    setHotkeyMsg(null);
    hotkeyInputRef.current?.focus();
  };

  const handleHotkeyKey = async (e: React.KeyboardEvent) => {
    if (!capturing) return;
    if (e.key === "Escape") {
      setCapturing(false);
      return;
    }
    captureHotkey(e, async (combo) => {
      try {
        await registerHotkey(combo);
        setHotkey(combo);
        setHotkeyState(combo);
        setCapturing(false);
        setHotkeyMsg(`Saved: ${combo}`);
        setTimeout(() => setHotkeyMsg(null), 2500);
      } catch (err) {
        setHotkeyMsg(String(err));
        setCapturing(false);
      }
    });
  };

  const handleClearCache = async () => {
    setCacheBusy(true);
    setCacheMsg(null);
    try {
      const msg = await clearCache();
      setCacheMsg(msg);
    } catch (e) {
      setCacheMsg(String(e));
    } finally {
      setCacheBusy(false);
      setTimeout(() => setCacheMsg(null), 3500);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
          Settings
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Configure how Valorant Buddy behaves.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-xl border border-border-strong bg-bg-surface p-5 space-y-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-accent/10 border border-accent/30 flex items-center justify-center">
            <Palette size={14} className="text-accent" />
          </div>
          <h2 className="text-text-primary text-sm font-semibold uppercase tracking-wider">
            Appearance
          </h2>
        </div>

        <div>
          <div className="text-text-secondary text-xs mb-2">Accent color</div>
          <div className="flex gap-2 flex-wrap">
            {(Object.keys(ACCENTS) as AccentColor[]).map((c) => {
              const a = ACCENTS[c];
              const active = accent === c;
              return (
                <button
                  key={c}
                  onClick={() => changeAccent(c)}
                  className={
                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border " +
                    (active
                      ? "border-border-strong bg-bg-elevated text-text-primary"
                      : "border-border-subtle bg-bg-base text-text-secondary hover:text-text-primary")
                  }
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: a.accent }}
                  />
                  {a.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-text-primary text-sm font-medium">
              Reduce motion
            </div>
            <div className="text-text-muted text-xs mt-0.5">
              Disable animations and transitions.
            </div>
          </div>
          <button
            onClick={toggleMotion}
            className={
              "relative w-11 h-6 rounded-full transition-colors shrink-0 " +
              (reduceMotion
                ? "bg-accent"
                : "bg-bg-elevated border border-border-strong")
            }
          >
            <motion.span
              layout
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className={
                "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md " +
                (reduceMotion ? "right-0.5" : "left-0.5")
              }
            />
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="rounded-xl border border-border-strong bg-bg-surface p-5 space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-accent/10 border border-accent/30 flex items-center justify-center">
            <Keyboard size={14} className="text-accent" />
          </div>
          <h2 className="text-text-primary text-sm font-semibold uppercase tracking-wider">
            Hotkeys
          </h2>
        </div>

        <div>
          <div className="text-text-secondary text-xs mb-1">
            Global toggle hotkey
          </div>
          <div className="text-text-muted text-[11px] mb-3">
            Shows or hides Valorant Buddy from anywhere in Windows.
          </div>

          <div
            ref={hotkeyInputRef}
            tabIndex={0}
            onKeyDown={handleHotkeyKey}
            onClick={startCapture}
            className={
              "px-3 py-2.5 rounded-md border text-sm font-mono cursor-pointer transition-colors outline-none " +
              (capturing
                ? "border-accent/60 bg-accent/5 text-accent"
                : "border-border-subtle bg-bg-elevated text-text-primary hover:border-border-strong")
            }
          >
            {capturing ? "Press a combo… (Esc to cancel)" : hotkey}
          </div>

          {hotkeyMsg && (
            <div className="mt-2 text-text-muted text-xs">{hotkeyMsg}</div>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="rounded-xl border border-border-strong bg-bg-surface p-5"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#5865F2]/10 border border-[#5865F2]/30 flex items-center justify-center shrink-0">
            <MessageCircle size={16} className="text-[#5865F2]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-text-primary font-medium text-sm">
                  Discord Rich Presence
                </div>
                <div className="text-text-muted text-xs mt-0.5">
                  Show "Playing Valorant Buddy" on Discord.
                </div>
              </div>
              <button
                onClick={toggleRpc}
                disabled={rpcBusy}
                className={
                  "relative w-11 h-6 rounded-full transition-colors shrink-0 " +
                  (rpcEnabled
                    ? "bg-accent"
                    : "bg-bg-elevated border border-border-strong")
                }
              >
                <motion.span
                  layout
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className={
                    "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md " +
                    (rpcEnabled ? "right-0.5" : "left-0.5")
                  }
                />
              </button>
            </div>
            {rpcMessage && (
              <div className="mt-3 text-text-muted text-xs">{rpcMessage}</div>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.12 }}
        className="rounded-xl border border-border-strong bg-bg-surface p-5"
      >
        <div className="flex items-start gap-4">
          <div className="w-8 h-8 rounded-md bg-accent/10 border border-accent/30 flex items-center justify-center shrink-0">
            <Trash2 size={14} className="text-accent" />
          </div>
          <div className="flex-1">
            <div className="text-text-primary font-medium text-sm">
              Clear cache
            </div>
            <div className="text-text-muted text-xs mt-0.5 mb-3">
              Deletes cached match data. Frees up disk space. Safe to do anytime.
            </div>
            <button
              onClick={handleClearCache}
              disabled={cacheBusy}
              className="px-3 py-1.5 rounded-md bg-bg-elevated border border-border-subtle hover:border-loss/40 hover:bg-loss/5 text-text-primary text-xs font-medium transition-colors disabled:opacity-50"
            >
              {cacheBusy ? "Clearing…" : "Clear cache"}
            </button>
            {cacheMsg && (
              <div className="mt-2 text-text-muted text-xs">{cacheMsg}</div>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="rounded-xl border border-border-subtle bg-bg-surface p-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-accent/10 border border-accent/30 flex items-center justify-center">
            <Zap size={14} className="text-accent" />
          </div>
          <div className="flex-1">
            <div className="text-text-primary text-sm font-medium">
              Valorant Buddy v0.1.0
            </div>
            <div className="text-text-muted text-xs mt-0.5">
              Made by Ace Development · Mahad Ansar
            </div>
          </div>
        </div>
      </motion.div>

      <div className="pt-8 pb-2 text-center">
        <p className="text-text-muted text-xs">
          Developed by{" "}
          <span className="text-accent font-medium">Ace Development</span>
          {" · "}
          <span className="text-text-secondary font-medium">Mahad Ansar</span>
        </p>
      </div>
    </div>
  );
}
