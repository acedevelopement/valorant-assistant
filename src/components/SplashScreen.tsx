import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, CheckCircle2, AlertCircle, Download } from "lucide-react";
import {
  checkForUpdate,
  downloadPendingUpdate,
  installAndRelaunch,
  type UpdateInfo,
} from "../lib/updater";
import logo from "../assets/logo.png";

type Stage =
  | "checking"
  | "up-to-date"
  | "downloading"
  | "ready"
  | "error"
  | "done";

interface Props {
  onComplete: () => void;
}

const MIN_SPLASH_MS = 800; // don't flash instantly even if check is fast

export default function SplashScreen({ onComplete }: Props) {
  const [stage, setStage] = useState<Stage>("checking");
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const started = Date.now();

    const run = async () => {
      // Give the check a moment even if it fails instantly
      const wait = (ms: number) =>
        new Promise((r) => setTimeout(r, ms));

      let info: UpdateInfo | null = null;
      try {
        info = await checkForUpdate();
      } catch (e) {
        if (!cancelled) {
          setErrorMsg(String(e));
          setStage("error");
        }
        return;
      }

      if (cancelled) return;

      if (!info) {
        const elapsed = Date.now() - started;
        const remaining = Math.max(0, MIN_SPLASH_MS - elapsed);
        await wait(remaining);
        if (cancelled) return;
        setStage("up-to-date");
        await wait(600);
        if (cancelled) return;
        setStage("done");
        onComplete();
        return;
      }

      setUpdate(info);
      setStage("downloading");

      const ok = await downloadPendingUpdate((downloaded, total) => {
        if (total > 0) {
          setProgress(Math.round((downloaded / total) * 100));
        }
      });

      if (cancelled) return;
      setStage(ok ? "ready" : "error");
      if (!ok) setErrorMsg("Download failed. You can continue and retry later.");
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [onComplete]);

  const handleInstallNow = async () => {
    try {
      await installAndRelaunch();
    } catch (e) {
      setErrorMsg(String(e));
      setStage("error");
    }
  };

  const handleSkip = () => {
    setStage("done");
    onComplete();
  };

  return (
    <AnimatePresence>
      {stage !== "done" && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[100] bg-bg-base flex items-center justify-center"
        >
          <div className="flex flex-col items-center gap-6 max-w-sm px-6 text-center">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="w-20 h-20 rounded-2xl overflow-hidden border border-accent/30 shadow-[0_0_60px_var(--color-accent-dim)] bg-bg-surface"
            >
              <img
                src={logo}
                alt="Valorant Buddy"
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* Brand */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <h1 className="text-text-primary text-xl font-semibold tracking-tight">
                Valorant Buddy
              </h1>
              <p className="text-text-muted text-xs mt-0.5">
                v0.1.0 · Ace Development
              </p>
            </motion.div>

            {/* Status */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="w-full"
            >
              {stage === "checking" && (
                <div className="flex items-center justify-center gap-2 text-text-secondary text-xs">
                  <RefreshCw size={12} className="animate-spin text-accent" />
                  Checking for updates…
                </div>
              )}

              {stage === "up-to-date" && (
                <div className="flex items-center justify-center gap-2 text-text-secondary text-xs">
                  <CheckCircle2 size={12} className="text-win" />
                  You're up to date.
                </div>
              )}

              {stage === "downloading" && (
                <div className="w-full">
                  <div className="flex items-center justify-center gap-2 text-text-secondary text-xs mb-3">
                    <Download size={12} className="text-accent" />
                    Downloading update v{update?.version}… {progress}%
                  </div>
                  <div className="h-1 rounded-full bg-bg-elevated overflow-hidden">
                    <motion.div
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                      className="h-full bg-accent"
                    />
                  </div>
                </div>
              )}

              {stage === "ready" && (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center justify-center gap-2 text-text-secondary text-xs">
                    <CheckCircle2 size={12} className="text-win" />
                    Update v{update?.version} ready.
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleInstallNow}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors shadow-[0_0_20px_var(--color-accent-dim)]"
                    >
                      <RefreshCw size={11} />
                      Restart to apply
                    </button>
                    <button
                      onClick={handleSkip}
                      className="px-4 py-2 rounded-md bg-bg-surface border border-border-subtle hover:border-border-strong text-text-secondary hover:text-text-primary text-xs transition-colors"
                    >
                      Skip
                    </button>
                  </div>
                </div>
              )}

              {stage === "error" && (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center justify-center gap-2 text-loss text-xs">
                    <AlertCircle size={12} />
                    {errorMsg ?? "Update check failed."}
                  </div>
                  <button
                    onClick={handleSkip}
                    className="px-4 py-2 rounded-md bg-bg-surface border border-border-subtle hover:border-border-strong text-text-secondary hover:text-text-primary text-xs transition-colors"
                  >
                    Continue anyway
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
