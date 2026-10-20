import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Gamepad2, RefreshCw } from "lucide-react";
import { getMatches, type MatchSummary } from "../lib/matches";
import { cn } from "../lib/utils";

function formatTime(ts: number): string {
  if (!ts) return "—";
  const ms = ts > 1e12 ? ts : ts * 1000;
  const d = new Date(ms);
  const now = Date.now();
  const diffMin = Math.floor((now - d.getTime()) / 60000);
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffMin < 60 * 24) return `${Math.floor(diffMin / 60)}h ago`;
  if (diffMin < 60 * 24 * 7) return `${Math.floor(diffMin / 60 / 24)}d ago`;
  return d.toLocaleDateString();
}

export default function Matches() {
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const m = await getMatches(15);
      setMatches(m);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-6 max-w-6xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
            Matches
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Your recent match history.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-bg-surface border border-border-subtle hover:border-border-strong text-text-secondary hover:text-text-primary text-xs transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {loading && matches.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-dashed border-border-subtle text-center">
          <Gamepad2 size={32} className="text-text-muted mb-3" />
          <h2 className="text-text-primary font-medium">Couldn't load matches</h2>
          <p className="text-text-muted text-sm mt-1 max-w-sm">{error}</p>
          <p className="text-text-muted text-xs mt-3">
            Make sure Riot Client is running.
          </p>
        </div>
      )}

      {!loading && !error && matches.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-dashed border-border-subtle text-center">
          <Gamepad2 size={32} className="text-text-muted mb-3" />
          <h2 className="text-text-primary font-medium">No matches found</h2>
          <p className="text-text-muted text-sm mt-1">
            Play a game and refresh.
          </p>
        </div>
      )}

      {matches.length > 0 && (
        <div className="space-y-2">
          {matches.map((m, i) => {
            const isWin = m.result === "win";
            const isLoss = m.result === "loss";
            const kd =
              m.deaths === 0
                ? m.kills.toFixed(2)
                : (m.kills / m.deaths).toFixed(2);

            return (
              <motion.div
                key={m.match_id + i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
                className="flex items-center gap-4 rounded-xl border border-border-subtle bg-bg-surface px-5 py-4 hover:border-border-strong transition-colors"
              >
                <div
                  className={cn(
                    "w-1 h-12 rounded-full shrink-0",
                    isWin ? "bg-win" : isLoss ? "bg-loss" : "bg-border-strong"
                  )}
                />

                <div className="w-24 shrink-0">
                  <div
                    className={cn(
                      "text-xs font-bold uppercase tracking-wider",
                      isWin ? "text-win" : isLoss ? "text-loss" : "text-text-muted"
                    )}
                  >
                    {isWin ? "Victory" : isLoss ? "Defeat" : "Draw"}
                  </div>
                  <div className="text-text-muted text-[11px] mt-0.5">
                    {m.score_ally} — {m.score_enemy}
                  </div>
                </div>

                <div className="w-32 shrink-0">
                  <div className="text-text-primary text-sm font-medium truncate">
                    {m.map || "Unknown"}
                  </div>
                  <div className="text-text-muted text-[11px] mt-0.5 uppercase">
                    {m.queue || "—"}
                  </div>
                </div>

                <div className="w-28 shrink-0">
                  <div className="text-text-primary text-sm font-mono tabular-nums">
                    {m.kills} / {m.deaths} / {m.assists}
                  </div>
                  <div className="text-text-muted text-[11px] mt-0.5">
                    {kd} K/D
                  </div>
                </div>

                <div className="w-20 shrink-0">
                  <div className="text-text-primary text-sm font-mono tabular-nums">
                    {m.acs || "—"}
                  </div>
                  <div className="text-text-muted text-[11px] mt-0.5">Score</div>
                </div>

                <div className="ml-auto text-text-muted text-[11px] shrink-0">
                  {formatTime(m.started_at)}
                </div>
              </motion.div>
            );
          })}
        </div>
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
