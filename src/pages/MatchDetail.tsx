import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { getMatchDetail, getMatchRanks, RANK_ICONS, type MatchDetail } from "../lib/player";
import { cn } from "../lib/utils";

// Calculate a Tracker.gg style score out of 1000
// We use ACS (Score), K/D, and Assists as our base.
function calculateBuddyScore(player: any, rounds: number): number {
  const acs = Math.round((player.score || 0) / (rounds || 1));
  const kd = player.kills / Math.max(player.deaths, 1);
  const assistsPerRound = player.assists / (rounds || 1);

  // Base score from ACS (Max 500 points)
  // 250 ACS is roughly a 7/10 performance (350 pts)
  let score = Math.min((acs / 250) * 500, 500);

  // K/D modifier (Max 300 points)
  // 1.0 K/D is average (150 pts), 2.0 K/D is amazing (300 pts)
  score += Math.min((kd / 2) * 300, 300);

  // Assist modifier (Max 200 points)
  score += Math.min(assistsPerRound * 100, 200);

  // Clamp between 0 and 1000
  return Math.max(0, Math.min(Math.round(score), 1000));
}

// Get Tracker.gg style color and letter
function getScoreTier(score: number) {
  if (score >= 800) return { label: "S", color: "text-blue-400 bg-blue-400/10 border-blue-400/30" };
  if (score >= 600) return { label: "A", color: "text-green-400 bg-green-400/10 border-green-400/30" };
  if (score >= 400) return { label: "B", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" };
  if (score >= 200) return { label: "C", color: "text-gray-400 bg-gray-400/10 border-gray-400/30" };
  return { label: "D", color: "text-rose-400 bg-rose-400/10 border-rose-400/30" };
}

export default function MatchDetailPage() {
  const { region, name, tag, matchId } = useParams<{
    region: string;
    name: string;
    tag: string;
    matchId: string;
  }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [ranks, setRanks] = useState<Record<string, string>>({});
  const [ranksLoading, setRanksLoading] = useState(false);
  const [ranksError, setRanksError] = useState<string | null>(null);

  useEffect(() => {
    if (!region || !matchId || !name || !tag) return;
    setLoading(true);
    setError(null);
    
    getMatchDetail(region, matchId, name, tag)
      .then((d) => {
        setDetail(d);
        
        setRanksLoading(true);
        const playerIds = d.players.map(p => `${p.name}#${p.tag}`);
        
        getMatchRanks(region, playerIds)
          .then((r) => {
            setRanks(r);
            setRanksError(null);
          })
          .catch((e) => setRanksError(String(e)))
          .finally(() => setRanksLoading(false));
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [region, matchId, name, tag]);

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-text-secondary hover:text-text-primary text-xs transition-colors"
        >
          <ChevronLeft size={14} /> Back
        </button>
        <div className="text-center py-20 text-loss text-sm">
          {error || "Match not found"}
        </div>
      </div>
    );
  }

  const subjectTeam = detail.subject_team.toLowerCase();
  
  let ourTeam = detail.players.filter(
    (p) => p.team.toLowerCase() === subjectTeam
  );
  let enemyTeam = detail.players.filter(
    (p) => p.team.toLowerCase() !== subjectTeam
  );

  // Sort by our calculated Buddy Score instead of raw ACS
  const sortPlayers = (a: any, b: any) => {
    const scoreA = calculateBuddyScore(a, detail.rounds.length);
    const scoreB = calculateBuddyScore(b, detail.rounds.length);
    return scoreB - scoreA;
  };

  ourTeam = ourTeam.sort(sortPlayers);
  enemyTeam = enemyTeam.sort(sortPlayers);

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
        className="rounded-xl border border-border-strong bg-bg-surface p-5"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-text-muted text-[11px] uppercase tracking-wider">
              {detail.mode || "Match"}
            </div>
            <div className="text-text-primary text-lg font-semibold mt-0.5">
              {detail.map || "Unknown Map"}
            </div>
          </div>
          <div className="text-text-muted text-[11px] font-mono">
            {detail.match_id.slice(0, 8)}
          </div>
        </div>
        {ranksError && (
          <div className="mt-3 px-3 py-2 rounded bg-loss/10 border border-loss/30 text-loss text-xs">
            Rank fetch error: {ranksError}
          </div>
        )}
      </motion.div>

      <TeamBlock title="Your Team" players={ourTeam} ranks={ranks} ranksLoading={ranksLoading} rounds={detail.rounds.length} />
      <TeamBlock title="Enemy Team" players={enemyTeam} ranks={ranks} ranksLoading={ranksLoading} rounds={detail.rounds.length} />

      {detail.rounds.length > 0 && (
        <div className="rounded-xl border border-border-subtle bg-bg-surface overflow-hidden">
          <div className="px-5 py-3 border-b border-border-subtle">
            <h2 className="text-text-primary text-sm font-semibold">Rounds</h2>
          </div>
          <div className="p-5 flex flex-wrap gap-2">
            {detail.rounds.map((r) => {
              const wonByUs = r.winning_team.toLowerCase() === subjectTeam;
              return (
                <div
                  key={r.round_num}
                  className={cn(
                    "w-10 h-10 rounded-md border flex items-center justify-center text-xs font-mono tabular-nums",
                    wonByUs
                      ? "bg-win/10 border-win/40 text-win"
                      : "bg-loss/10 border-loss/40 text-loss"
                  )}
                  title={r.winning_team}
                >
                  {r.round_num}
                </div>
              );
            })}
          </div>
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

function TeamBlock({
  title,
  players,
  ranks,
  ranksLoading,
  rounds,
}: {
  title: string;
  players: any[];
  ranks: Record<string, string>;
  ranksLoading: boolean;
  rounds: number;
}) {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface overflow-hidden">
      <div className="px-5 py-3 border-b border-border-subtle flex justify-between items-center">
        <h2 className="text-text-primary text-sm font-semibold">{title}</h2>
        <div className="flex gap-6 text-[10px] text-text-muted uppercase tracking-wider font-semibold pr-2">
          <span>K / D / A</span>
          <span className="w-12 text-right">Buddy Score</span>
        </div>
      </div>
      <div className="divide-y divide-border-subtle">
        {players.length === 0 && (
          <div className="px-5 py-4 text-text-muted text-xs">
            No players detected.
          </div>
        )}
        {players.map((p, i) => {
          const pRank = ranks[`${p.name}#${p.tag}`];
          const icon = pRank ? RANK_ICONS[pRank.toLowerCase()] : null;
          const buddyScore = calculateBuddyScore(p, rounds);
          const tier = getScoreTier(buddyScore);

          return (
            <motion.div
              key={p.name + p.tag + i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: i * 0.03 }}
              className={cn(
                "px-5 py-3 flex items-center gap-4",
                p.is_subject && "bg-accent/5"
              )}
            >
              <div
                className={cn(
                  "w-1 h-9 rounded-full shrink-0",
                  p.is_subject ? "bg-accent" : "bg-border-strong"
                )}
              />
              
              {/* Rank Display */}
              <div className="w-24 shrink-0 flex items-center gap-2">
                {ranksLoading ? (
                  <div className="w-4 h-4 border-2 border-text-muted/30 border-t-text-muted rounded-full animate-spin" />
                ) : icon ? (
                  <>
                    <img src={icon} alt={pRank} className="w-6 h-6 object-contain" title={pRank} />
                    <span className="text-text-primary text-[10px] truncate">{pRank}</span>
                  </>
                ) : (
                  <span className="text-text-muted text-[10px] font-mono leading-tight truncate">
                    {pRank || "?"}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-text-primary text-sm font-medium truncate">
                  {p.name || "Unknown"}
                  {p.tag && (
                    <span className="text-text-muted text-xs ml-1">
                      #{p.tag}
                    </span>
                  )}
                  {p.is_subject && (
                    <span className="ml-2 text-accent text-[10px] uppercase tracking-wider">
                      Subject
                    </span>
                  )}
                </div>
                <div className="text-text-muted text-xs mt-0.5">
                  {p.agent || "—"}
                </div>
              </div>
              
              <div className="w-20 text-right shrink-0">
                <div className="text-text-primary text-sm font-mono tabular-nums">
                  {p.kills} / {p.deaths} / {p.assists}
                </div>
                <div className="text-text-muted text-[10px] mt-0.5">
                  K / D / A
                </div>
              </div>

              {/* Buddy Score Display */}
              <div className="w-20 text-right shrink-0 pr-2 flex flex-col items-end">
                <div className="flex items-center gap-1.5">
                  <span className={cn("text-[9px] font-bold px-1 rounded border", tier.color)}>
                    {tier.label}
                  </span>
                  <span className="text-text-primary text-sm font-mono font-bold tabular-nums">
                    {buddyScore}
                  </span>
                </div>
                <div className="text-text-muted text-[10px] mt-0.5">
                  / 1000
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
