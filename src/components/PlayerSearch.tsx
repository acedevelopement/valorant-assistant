import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, User } from "lucide-react";

interface PlayerLookup {
  name: string;
  tag: string;
  region: string;
  rank: string;
  rr: number | null;
  peak_rank: string | null;
}

const REGIONS = ["eu", "na", "ap", "kr", "br", "latam"] as const;

export default function PlayerSearch({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<string>("eu");
  const [result, setResult] = useState<PlayerLookup | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const parts = query.split("#");
    if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) {
      setError("Use format: Name#Tag");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await invoke<PlayerLookup>("lookup_player", {
        region,
        name: parts[0].trim(),
        tag: parts[1].trim(),
      });
      setResult(res);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const goToProfile = () => {
    if (!result) return;
    navigate(`/players/${region}/${result.name}/${result.tag}`, {
      state: {
        rank: result.rank,
        rr: result.rr,
      },
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-24 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.98 }}
        className="w-full max-w-lg bg-bg-surface border border-border-strong rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <form
          onSubmit={handleSearch}
          className="flex items-center border-b border-border-subtle px-4 py-3 gap-3"
        >
          <Search size={18} className="text-text-muted shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter Riot ID (e.g. TenZ#NA1)"
            className="flex-1 bg-transparent border-none outline-none text-text-primary text-sm placeholder:text-text-muted"
          />
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="bg-bg-elevated border border-border-subtle rounded-md text-text-primary text-xs px-2 py-1 outline-none"
          >
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r.toUpperCase()}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-text-primary shrink-0"
          >
            <X size={18} />
          </button>
        </form>

        <div className="p-4 max-h-96 overflow-y-auto">
          {loading && (
            <div className="text-center py-4 text-text-muted text-sm">
              Searching…
            </div>
          )}
          {error && (
            <div className="text-center py-4 text-loss text-sm">{error}</div>
          )}

          <AnimatePresence>
            {result && (
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={goToProfile}
                className="w-full flex items-center gap-4 p-3 rounded-lg bg-bg-elevated border border-border-subtle hover:border-accent/40 transition-colors text-left"
              >
                <div className="w-12 h-12 rounded-md overflow-hidden bg-bg-base border border-border-strong flex items-center justify-center shrink-0">
                  <User size={20} className="text-text-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-text-primary font-medium">
                    {result.name}
                    <span className="text-text-muted text-sm ml-1">
                      #{result.tag}
                    </span>
                  </div>
                  <div className="text-text-secondary text-xs mt-0.5">
                    {result.rank}
                    {result.rr !== null && (
                      <span className="text-text-muted"> · {result.rr} RR</span>
                    )}
                  </div>
                  {result.peak_rank && (
                    <div className="text-text-muted text-[11px] mt-0.5">
                      Peak: {result.peak_rank}
                    </div>
                  )}
                  <div className="text-text-muted text-[10px] mt-0.5 uppercase">
                    {result.region}
                  </div>
                </div>
              </motion.button>
            )}
          </AnimatePresence>

          {!result && !loading && !error && (
            <div className="text-center py-8 text-text-muted text-xs">
              Search any Valorant player by Riot ID
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
