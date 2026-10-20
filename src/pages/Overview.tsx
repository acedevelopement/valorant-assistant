import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { RefreshCw, AlertCircle } from "lucide-react";
import {
  getRiotSession,
  fetchRank,
  type RiotSession,
  type RankInfo,
} from "../lib/riot";

const RETRY_MS = 5000;

export default function Overview() {
  const [session, setSession] = useState<RiotSession | null>(null);
  const [rank, setRank] = useState<RankInfo | null>(null);
  const [checking, setChecking] = useState(true);
  const [rankLoading, setRankLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkSession = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    try {
      const s = await getRiotSession();
      setSession(s);
    } catch (e) {
      console.error(e);
    } finally {
      setChecking(false);
      if (manual) setTimeout(() => setIsRefreshing(false), 500);
    }
  }, []);

  // Auto-poll for Riot Client every 5 seconds
  useEffect(() => {
    checkSession();
    const id = setInterval(() => checkSession(false), RETRY_MS);
    return () => clearInterval(id);
  }, [checkSession]);

  // Fetch rank when session is found
  useEffect(() => {
    if (!session?.logged_in) {
      setRank(null);
      return;
    }
    
    let cancelled = false;
    setRankLoading(true);
    
    fetchRank(session.region, session.game_name, session.tag_line)
      .then((r) => {
        if (!cancelled) setRank(r);
      })
      .catch((e) => {
        if (!cancelled) console.error("Rank fetch failed:", e);
      })
      .finally(() => {
        if (!cancelled) setRankLoading(false);
      });
      
    return () => { cancelled = true; };
  }, [session?.puuid, session?.logged_in]);

  const rankInitials =
    rank?.rank
      .split(" ")
      .map((s) => s[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "—";

  return (
    <div className="p-6 max-w-6xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
            Overview
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Your Valorant performance at a glance.
          </p>
        </div>
        <button
          onClick={() => checkSession(true)}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-bg-surface border border-border-subtle hover:border-border-strong text-text-secondary hover:text-text-primary text-xs transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {checking && (
        <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-dashed border-border-subtle">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-text-muted text-sm mt-4">Detecting account…</p>
        </div>
      )}

      {!checking && !session?.logged_in && (
        <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-dashed border-border-subtle text-center">
          <div className="w-12 h-12 rounded-lg bg-bg-surface border border-border-subtle flex items-center justify-center mb-4">
            <AlertCircle size={22} className="text-text-muted" />
          </div>
          <h2 className="text-text-primary font-medium">
            Waiting for Riot Client…
          </h2>
          <p className="text-text-muted text-sm mt-1 max-w-xs">
            Launch Valorant or the Riot Client and log in. We will detect your account automatically.
          </p>
        </div>
      )}

      {!checking && session?.logged_in && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-xl border border-border-strong bg-bg-surface p-6"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent pointer-events-none" />

          <div className="relative flex items-center gap-6">
            <div className="w-24 h-24 rounded-xl bg-bg-elevated border border-accent/30 flex items-center justify-center shadow-[0_0_40px_var(--color-accent-dim)] shrink-0">
              <span className="text-accent text-2xl font-bold tracking-tight">
                {rank?.rank ? rankInitials : session.game_name.slice(0, 2).toUpperCase()}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-text-primary text-lg font-semibold">
                  {session.game_name}
                </span>
                <span className="text-text-muted text-sm">
                  #{session.tag_line}
                </span>
              </div>

              <div className="mt-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-win" />
                <span className="text-text-secondary text-xs">Connected</span>
                {session.region && (
                  <>
                    <span className="text-text-muted text-xs">•</span>
                    <span className="text-text-muted text-xs uppercase">
                      {session.region}
                    </span>
                  </>
                )}
              </div>

              <div className="mt-4">
                {rankLoading && (
                  <span className="text-text-muted text-xs">Fetching rank…</span>
                )}

                {!rankLoading && rank && (
                  <>
                    <div className="flex items-baseline justify-between mb-1.5">
                      <span className="text-text-secondary text-xs">
                        <span className="text-accent font-semibold">
                          {rank.rank}
                        </span>
                      </span>
                      {rank.rr !== null && (
                        <span className="text-text-muted text-xs">
                          {rank.rr} RR
                        </span>
                      )}
                    </div>
                    {rank.peak_rank && (
                      <div className="text-text-muted text-[11px] mb-1.5">
                        Peak: {rank.peak_rank}
                      </div>
                    )}
                    {rank.rr !== null && (
                      <div className="h-1.5 rounded-full bg-bg-elevated overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${rank.rr}%` }}
                          transition={{
                            duration: 1,
                            ease: [0.16, 1, 0.3, 1],
                            delay: 0.2,
                          }}
                          className="h-full bg-accent rounded-full shadow-[0_0_10px_var(--color-accent)]"
                        />
                      </div>
                    )}
                  </>
                )}

                {!rankLoading && !rank && (
                  <span className="text-text-muted text-xs">
                    Rank unavailable
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

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
