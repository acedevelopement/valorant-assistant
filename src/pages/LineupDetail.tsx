import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, Star, Target, Crosshair } from "lucide-react";
import { getLineupById } from "../lib/lineupStore";
import { useState } from "react";
import { getFavorites, toggleFavorite, difficultyColor } from "../lib/lineupStore";

function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.slice(1).split("/")[0] || null;
    }
    // youtube.com/shorts/{id}
    if (u.pathname.startsWith("/shorts/")) {
      return u.pathname.replace("/shorts/", "").split("/")[0] || null;
    }
    // youtube.com/watch?v={id}
    return u.searchParams.get("v");
  } catch {
    return null;
  }
}
export default function LineupDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const lineup = id ? getLineupById(id) : undefined;
  const [favorites, setFavorites] = useState(getFavorites());

  if (!lineup) {
    return (
      <div className="p-6 max-w-3xl">
        <button
          onClick={() => navigate("/lineups")}
          className="flex items-center gap-1 text-text-secondary hover:text-text-primary text-xs transition-colors"
        >
          <ChevronLeft size={14} /> Back to Lineups
        </button>
        <div className="mt-10 text-center">
          <h1 className="text-text-primary font-medium">Lineup not found</h1>
        </div>
      </div>
    );
  }

  const isFav = favorites.includes(lineup.id);
  const handleFav = () => setFavorites(toggleFavorite(lineup.id));
  const vid = lineup.videoUrl ? youtubeId(lineup.videoUrl) : null;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => navigate("/lineups")}
        className="flex items-center gap-1 text-text-secondary hover:text-text-primary text-xs transition-colors"
      >
        <ChevronLeft size={14} /> Back to Lineups
      </button>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-xl border border-border-strong bg-bg-surface p-6 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-text-muted bg-bg-elevated px-2 py-1 rounded border border-border-subtle">
                {lineup.map} · {lineup.site}
              </span>
              <span
                className={
                  "text-[10px] uppercase tracking-wider font-medium " +
                  difficultyColor[lineup.difficulty]
                }
              >
                {lineup.difficulty}
              </span>
            </div>

            <button
              onClick={handleFav}
              className={
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border " +
                (isFav
                  ? "bg-accent/10 border-accent/40 text-accent"
                  : "bg-bg-surface border-border-subtle text-text-secondary hover:text-text-primary")
              }
            >
              <Star size={12} fill={isFav ? "currentColor" : "none"} />
              {isFav ? "Favorited" : "Favorite"}
            </button>
          </div>

          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
            {lineup.title}
          </h1>

          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className="text-accent font-medium">{lineup.agent}</span>
            <span className="text-text-muted">·</span>
            <span className="text-text-secondary">{lineup.ability}</span>
          </div>
        </div>
      </motion.div>

      {vid && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
          className="rounded-xl overflow-hidden border border-border-strong bg-black aspect-video"
        >
          <iframe
            src={`https://www.youtube.com/embed/${vid}`}
            title={lineup.title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </motion.div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <InfoCard
          icon={<Target size={14} />}
          label="Stand Here"
          value={lineup.fromLocation}
        />
        <InfoCard
          icon={<Crosshair size={14} />}
          label="Target"
          value={lineup.targetLocation}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatBox label="Charge Bars" value={lineup.chargeBars} />
        <StatBox label="Bounces" value={lineup.bounces} />
      </div>

      <div className="rounded-xl border border-border-subtle bg-bg-surface p-5">
        <h2 className="text-text-primary text-sm font-semibold mb-3">
          Instructions
        </h2>
        <ol className="space-y-2">
          {lineup.instructions.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="text-accent font-mono text-xs mt-0.5 w-5 shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-text-secondary leading-relaxed">
                {step}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface p-4">
      <div className="flex items-center gap-2 text-text-muted text-[10px] uppercase tracking-wider mb-2">
        {icon}
        {label}
      </div>
      <div className="text-text-primary text-sm leading-snug">{value}</div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface p-4 text-center">
      <div className="text-2xl font-bold text-accent tabular-nums">{value}</div>
      <div className="text-text-muted text-[10px] uppercase tracking-wider mt-1">
        {label}
      </div>
    </div>
  );
}
