import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Users, Calendar, MapPin, ExternalLink } from "lucide-react";
import { TOURNAMENTS, type Tournament, type TournamentStatus } from "../data/tournaments";
import { getLocalTournaments, type LocalTournament } from "../lib/admin";
import { cn } from "../lib/utils";

type Filter = "all" | TournamentStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "registering", label: "Registering" },
  { value: "upcoming", label: "Upcoming" },
  { value: "live", label: "Live" },
  { value: "completed", label: "Completed" },
];

// Convert a LocalTournament (from admin panel, snake_case) to the
// bundled Tournament shape (camelCase) so both render identically.
function fromLocal(t: LocalTournament): Tournament {
  return {
    id: t.id,
    title: t.title,
    organizer: t.organizer,
    region: t.region,
    server: t.server,
    prizePool: t.prize_pool,
    maxTeams: t.max_teams,
    registrationOpens: t.registration_opens,
    registrationCloses: t.registration_closes,
    startTime: t.start_time,
    durationHours: t.duration_hours,
    description: t.description,
    links: t.links,
    bannerUrl: t.banner_url,
  };
}

function computeStatus(t: Tournament): TournamentStatus {
  const now = Date.now();
  const opens = new Date(t.registrationOpens).getTime();
  const closes = new Date(t.registrationCloses).getTime();
  const starts = new Date(t.startTime).getTime();
  const ends = starts + t.durationHours * 60 * 60 * 1000;

  if (now < opens) return "upcoming";
  if (now >= opens && now < closes) return "registering";
  if (now >= starts && now < ends) return "live";
  if (now >= ends) return "completed";
  return "upcoming";
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeUntil(iso: string): string {
  const now = Date.now();
  const target = new Date(iso).getTime();
  const diff = target - now;
  if (diff < 0) return "past";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `in ${days}d ${hours}h`;
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `in ${hours}h ${mins}m`;
}

const STATUS_STYLE: Record<TournamentStatus, { label: string; color: string }> = {
  registering: { label: "Registering", color: "text-win border-win/40 bg-win/10" },
  upcoming: { label: "Upcoming", color: "text-text-secondary border-border-strong bg-bg-elevated" },
  live: { label: "Live", color: "text-accent border-accent/40 bg-accent/10" },
  completed: { label: "Completed", color: "text-text-muted border-border-subtle bg-bg-elevated" },
};

export default function Tournaments() {
  const [filter, setFilter] = useState<Filter>("all");
  const [all, setAll] = useState<Tournament[]>(TOURNAMENTS);

  // Load local (admin-posted) tournaments and merge with bundled
  useEffect(() => {
    let cancelled = false;
    getLocalTournaments()
      .then((list) => {
        if (cancelled) return;
        const local = list.map(fromLocal);
        // Local tournaments override bundled ones with the same id
        const ids = new Set(local.map((t) => t.id));
        const merged = [...local, ...TOURNAMENTS.filter((t) => !ids.has(t.id))];
        setAll(merged);
      })
      .catch(() => {
        // If reading fails, just use bundled
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const withStatus = all
    .map((t) => ({ tournament: t, status: computeStatus(t) }))
    .sort((a, b) => {
      const order: TournamentStatus[] = ["live", "registering", "upcoming", "completed"];
      return order.indexOf(a.status) - order.indexOf(b.status);
    });

  const filtered =
    filter === "all" ? withStatus : withStatus.filter((x) => x.status === filter);

  return (
    <div className="p-6 max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
          Tournaments
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Community tournaments organized by Ace Development and partners.
        </p>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-colors border",
              filter === f.value
                ? "bg-accent/10 border-accent/40 text-accent"
                : "bg-bg-surface border-border-subtle text-text-secondary hover:text-text-primary"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-dashed border-border-subtle text-center">
          <Trophy size={32} className="text-text-muted mb-3" />
          <h2 className="text-text-primary font-medium">No tournaments</h2>
          <p className="text-text-muted text-sm mt-1">
            Check back later — new ones drop regularly.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(({ tournament: t, status }, i) => {
            const st = STATUS_STYLE[status];
            const registerLink = t.links.find((l) =>
              l.label.toLowerCase().startsWith("register")
            );

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="rounded-xl border border-border-subtle bg-bg-surface p-5 hover:border-border-strong transition-colors"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className={cn(
                          "text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded border",
                          st.color
                        )}
                      >
                        {st.label}
                      </span>
                      <span className="text-text-muted text-[11px] uppercase tracking-wider">
                        {t.region} · {t.server}
                      </span>
                    </div>

                    <h3 className="text-text-primary text-lg font-semibold leading-tight">
                      {t.title}
                    </h3>
                    <div className="text-text-muted text-xs mt-0.5">
                      Organized by {t.organizer}
                    </div>
                  </div>

                  {status === "registering" && registerLink && (
                    <a
                      href={registerLink.url}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-md bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors shadow-[0_0_20px_var(--color-accent-dim)]"
                    >
                      Register
                      <ExternalLink size={11} />
                    </a>
                  )}
                </div>

                <p className="text-text-secondary text-sm leading-relaxed mb-4">
                  {t.description}
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <Info icon={<Trophy size={12} />} label="Prize pool" value={t.prizePool} />
                  <Info icon={<Users size={12} />} label="Max teams" value={String(t.maxTeams)} />
                  <Info icon={<MapPin size={12} />} label="Server" value={t.server} />
                  <Info
                    icon={<Calendar size={12} />}
                    label={status === "registering" ? "Closes" : "Starts"}
                    value={
                      status === "registering"
                        ? `${formatDate(t.registrationCloses)} (${timeUntil(t.registrationCloses)})`
                        : `${formatDate(t.startTime)} (${timeUntil(t.startTime)})`
                    }
                  />
                </div>

                {t.links.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-border-subtle">
                    {t.links.map((l) => (
                      <a
                        key={l.url}
                        href={l.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-text-secondary hover:text-text-primary text-xs transition-colors px-2 py-1 rounded hover:bg-bg-elevated"
                      >
                        {l.label}
                        <ExternalLink size={10} />
                      </a>
                    ))}
                  </div>
                )}
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

function Info({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border-subtle bg-bg-base px-3 py-2">
      <div className="flex items-center gap-1.5 text-text-muted text-[10px] uppercase tracking-wider mb-1">
        {icon}
        {label}
      </div>
      <div className="text-text-primary text-xs font-medium truncate">{value}</div>
    </div>
  );
}
