import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, RefreshCw, X } from "lucide-react";
import {
  checkForUpdate,
  downloadPendingUpdate,
  installAndRelaunch,
  type UpdateInfo,
} from "../lib/updater";

const CHECK_DELAY_MS = 30_000;       // first check 30s after launch
const RECHECK_INTERVAL_MS = 4 * 60 * 60 * 1000; // then every 4 hours

type Stage = "idle" | "checking" | "downloading" | "ready" | "installing";

export default function UpdateBanner() {
  const [stage, setStage] = useState<Stage>("idle");
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [progress, setProgress] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  // Auto-check + auto-download (silent until ready)
  useEffect(() => {
    let cancelled = false;

    const runCheck = async () => {
      if (cancelled) return;
      setStage("checking");

      const info = await checkForUpdate();
      if (cancelled) return;

      if (!info) {
        setStage("idle");
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
      setStage(ok ? "ready" : "idle");
    };

    const firstTimer = setTimeout(runCheck, CHECK_DELAY_MS);
    const interval = setInterval(runCheck, RECHECK_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearTimeout(firstTimer);
      clearInterval(interval);
    };
  }, []);

  const handleInstall = async () => {
    setStage("installing");
    try {
      await installAndRelaunch();
    } catch {
      setStage("ready");
    }
  };

  const visible =
    !dismissed &&
    update !== null &&
    (stage === "downloading" || stage === "ready" || stage === "installing");

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-24 right-6 z-50 w-[380px] rounded-xl border border-accent/40 bg-bg-surface shadow-2xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent pointer-events-none" />

          <div className="relative p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-accent/15 border border-accent/40 flex items-center justify-center shrink-0">
                <Download size={15} className="text-accent" />
              </div>

              <div className="flex-1 min-w-0">
                {stage === "downloading" && (
                  <>
                    <div className="text-text-primary text-sm font-medium">
                      Downloading update v{update.version}
                    </div>
                    <div className="text-text-muted text-xs mt-0.5">
                      {progress}%
                    </div>
                    <div className="mt-2 h-1 rounded-full bg-bg-elevated overflow-hidden">
                      <motion.div
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                        className="h-full bg-accent"
                      />
                    </div>
                  </>
                )}

                {(stage === "ready" || stage === "installing") && (
                  <>
                    <div className="text-text-primary text-sm font-medium">
                      Update v{update.version} ready
                    </div>
                    <div className="text-text-muted text-xs mt-0.5">
                      Restart to install the new version.
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={handleInstall}
                        disabled={stage === "installing"}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        <RefreshCw
                          size={11}
                          className={stage === "installing" ? "animate-spin" : ""}
                        />
                        {stage === "installing" ? "Restarting…" : "Restart now"}
                      </button>
                      <button
                        onClick={() => setDismissed(true)}
                        className="px-3 py-1.5 rounded-md text-text-secondary hover:text-text-primary text-xs transition-colors"
                      >
                        Later
                      </button>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => setDismissed(true)}
                className="text-text-muted hover:text-text-primary transition-colors shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
