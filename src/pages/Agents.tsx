import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sword } from "lucide-react";
import { getAgents, type Agent } from "../lib/agents";

export default function Agents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getAgents()
      .then(setAgents)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
          Agents
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Browse every playable agent, their role, and abilities.
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="text-center py-20 text-loss text-sm">{error}</div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-4 gap-4">
          {agents.map((a, i) => (
            <motion.button
              key={a.uuid}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.02 }}
              onClick={() => navigate(`/agents/${a.uuid}`)}
              className="text-left rounded-xl border border-border-subtle bg-bg-surface overflow-hidden hover:border-accent/40 transition-colors group"
            >
              <div className="aspect-[3/4] bg-bg-base overflow-hidden">
                {a.full_portrait ? (
                  <img
                    src={a.full_portrait}
                    alt={a.display_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Sword size={24} className="text-text-muted" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <div className="text-text-primary font-medium text-sm">
                  {a.display_name}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  {a.role_icon && (
                    <img src={a.role_icon} alt="" className="w-3 h-3 opacity-60" />
                  )}
                  <span className="text-text-muted text-[10px] uppercase tracking-wider">
                    {a.role}
                  </span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
