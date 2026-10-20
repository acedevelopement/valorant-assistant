import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, RefreshCw, Trophy } from "lucide-react";
import {
  getPlayerMatches,
  getPlayerRank,
  RANK_ICONS,
  type PlayerMatch,
  type PlayerRank,
  type MatchMode,
} from "../lib/player";
import { cn } from "../lib/utils";

const MODES: { value: MatchMode; label: string }[] = [
  { value: "all", label: "All" },
  { value: "competitive", label: "Competitive" },
  { value: "unrated", label: "Unrated" },
  { value: "deathmatch", label: "TDM" },
  { value: "custom", label: "Customs" },
];

interface RouteState {
  rank?: string;
  rr?: number | null;
}

function formatTime(ts: number): string {
  if (!ts) return "—";
  const ms = ts > 1e12 ? ts : ts * 1000;
  const d = new Date(ms);
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffMin < 60 * 24) return `${Math.floor(diffMin / 60)}h ago`;
  if (diffMin < 60 * 24 * 7) return `${Math.floor(diffMin / 60 / 24)}d ago`;
  return d.toLocaleDateString();
}

export default function PlayerProfile() {
  const { region, name, tag } = useParams<{
    region: string;
    name: string;
    tag: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = (location.state ?? {}) as RouteState;

  const [matches, setMatches] = useState<PlayerMatch[]>([]);
  const [rank, setRank] = useState<PlayerRank | null>(null);
  const [loading, setLoading] = useState(true);
  const [rankLoading, setRankLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<MatchMode>("all");

  const [peakRank, setPeakRank] = useState<string | null>(null);

  const loadRank = async () => {
    if (!region || !name || !tag) return;

    if (routeState.rank) {
      setRank({
        rank: routeState.rank,
        rr: routeState.rr ?? null,
        peak_rank: null,
      });
      setRankLoading(false);

      try {
        const r = await getPlayerRank(region, name, tag);
        setPeakRank(r.peak_rank);
      } catch {}
      return;
    }

    setRankLoading(true);
    try {
      const r = await getPlayerRank(region, name, tag);
      setRank(r);
      setPeakRank(r.peak_rank);
    } catch {
      setRank(null);
    } finally {
      setRankLoading(false);
    }
  };

  const loadMatches = async () => {
    if (!region || !name || !tag) return;
    setLoading(true);
    setError(null);
    try {
      const m = await getPlayerMatches(region, name, tag, 10, mode);
      setMatches(m);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRank();
  }, [region, name, tag]);

  useEffect(() => {
    loadMatches();
  }, [region, name, tag, mode]);

  const refresh = () => {
    loadRank();
    loadMatches();
  };

  const displayPeak = rank?.peak_rank ?? peakRank;
  const rankIcon = rank?.rank ? RANK_ICONS[rank.rank.toLowerCase()] : null;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-text-secondary hover:text-text-primary text-xs transition-colors"
      >
        <ChevronLeft size={14} /> Back
      </button>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-xl border border-border-strong bg-bg-surface p-6"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent pointer-events-none" />

        <div className="relative flex items-center gap-6">
          <div className="w-24 h-24 rounded-xl bg-bg-elevated border border-accent/30 flex items-center justify-center shadow-[0_0_40px_var(--color-accent-dim)] shrink-0 overflow-hidden">
            {rankLoading ? (
              <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            ) : rankIcon ? (
              <img src={rankIcon} alt={rank?.rank} className="w-16 h-16 object-contain" />
            ) : (
              <span className="text-accent text-2xl font-bold tracking-tight">
                {rank?.rank ? rank.rank.substring(0, 2).toUpperCase() : "—"}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-text-primary text-lg font-semibold">
                {name}
              </span>
              <span className="text-text-muted text-sm">#{tag}</span>
            </div>

            <div className="mt-1 flex items-center gap-2">
              <span className="text-text-muted text-xs uppercase">
                {region}
              </span>
              {displayPeak && (
                <>
                  <span className="text-text-muted text-xs">•</span>
                  <Trophy size={11} className="text-text-muted" />
                  <span className="text-text-muted text-xs">
                    Peak: {displayPeak}
                  </span>
                </>
              )}
            </div>

            {rank && !rankLoading && (
              <div className="mt-4">
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
              </div>
            )}

            {!rank && !rankLoading && (
              <div className="mt-3 text-text-muted text-xs">
                Rank unavailable
              </div>
            )}
          </div>

          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-bg-surface border border-border-subtle hover:border-border-strong text-text-secondary hover:text-text-primary text-xs transition-colors disabled:opacity-50 shrink-0 self-start"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </motion.div>

      <div className="flex gap-1.5 flex-wrap">
        {MODES.map((m) => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors border",
              mode === m.value
                ? "bg-accent/10 border-accent/40 text-accent"
                : "bg-bg-surface border-border-subtle text-text-secondary hover:text-text-primary"
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {loading && matches.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-dashed border-border-subtle text-center">
          <h2 className="text-text-primary font-medium">
            Couldn't load matches
          </h2>
          <p className="text-text-muted text-sm mt-1 max-w-md break-all">
            {error}
          </p>
        </div>
      )}

      {!loading && !error && matches.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-dashed border-border-subtle text-center">
          <h2 className="text-text-primary font-medium">No matches found</h2>
          <p className="text-text-muted text-sm mt-1">Try a different filter.</p>
        </div>
      )}

      {matches.length > 0 && (
        <div className="space-y-2">
          {matches.map((m, i) => {
            const isWin = m.result.toLowerCase().includes("win");
            const isLoss = m.result.toLowerCase().includes("loss");
            const kd =
              m.deaths === 0
                ? m.kills.toFixed(2)
                : (m.kills / m.deaths).toFixed(2);

            return (
              <motion.button
                key={m.match_id + i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.02 }}
                onClick={() =>
                  navigate(
                    `/players/${region}/${name}/${tag}/match/${m.match_id}`
                  )
                }
                className="w-full flex items-center gap-4 rounded-xl border border-border-subtle bg-bg-surface px-5 py-4 hover:border-border-strong transition-colors text-left"
              >
                <div
                  className={cn(
                    "w-1 h-12 rounded-full shrink-0",
                    isWin
                      ? "bg-win"
                      : isLoss
                      ? "bg-loss"
                      : "bg-border-strong"
                  )}
                />

                <div className="w-24 shrink-0">
                  <div
                    className={cn(
                      "text-xs font-bold uppercase tracking-wider",
                      isWin
                        ? "text-win"
                        : isLoss
                        ? "text-loss"
                        : "text-text-muted"
                    )}
                  >
                    {isWin ? "Victory" : isLoss ? "Defeat" : m.result || "—"}
                  </div>
                  <div className="text-text-muted text-[11px] mt-0.5">
                    {m.score_ally} — {m.score_enemy}
                  </div>
                </div>

                <div className="w-28 shrink-0">
                  <div className="text-text-primary text-sm font-medium truncate">
                    {m.map || "Unknown"}
                  </div>
                  <div className="text-text-muted text-[11px] mt-0.5 uppercase">
                    {m.mode || "—"}
                  </div>
                </div>

                <div className="w-24 shrink-0">
                  <div className="text-text-primary text-sm font-medium truncate">
                    {m.agent || "—"}
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

                <div className="ml-auto text-text-muted text-[11px] shrink-0">
                  {formatTime(m.started_at)}
                </div>
              </motion.button>
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
