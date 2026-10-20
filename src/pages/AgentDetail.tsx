import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { getAgents, type Agent } from "../lib/agents";

export default function AgentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getAgents()
      .then((list) => setAgent(list.find((a) => a.uuid === id) ?? null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 max-w-4xl flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="p-6 max-w-4xl">
        <button
          onClick={() => navigate("/agents")}
          className="flex items-center gap-1 text-text-secondary hover:text-text-primary text-xs transition-colors"
        >
          <ChevronLeft size={14} /> Back to Agents
        </button>
        <div className="mt-10 text-center text-text-muted">Agent not found</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => navigate("/agents")}
        className="flex items-center gap-1 text-text-secondary hover:text-text-primary text-xs transition-colors"
      >
        <ChevronLeft size={14} /> Back to Agents
      </button>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-6 rounded-xl border border-border-strong bg-bg-surface p-6 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative w-40 h-52 rounded-lg overflow-hidden bg-bg-base shrink-0 border border-border-subtle">
          {agent.full_portrait && (
            <img src={agent.full_portrait} alt={agent.display_name} className="w-full h-full object-cover" />
          )}
        </div>
        <div className="relative flex-1">
          <div className="flex items-center gap-2 mb-2">
            {agent.role_icon && <img src={agent.role_icon} alt="" className="w-4 h-4" />}
            <span className="text-text-muted text-[10px] uppercase tracking-wider">
              {agent.role}
            </span>
          </div>
          <h1 className="text-3xl font-semibold text-text-primary tracking-tight">
            {agent.display_name}
          </h1>
          <p className="text-text-secondary text-sm mt-3 leading-relaxed">
            {agent.description}
          </p>
        </div>
      </motion.div>

      <div className="space-y-3">
        <h2 className="text-text-primary text-sm font-semibold">Abilities</h2>
        {agent.abilities.map((ab, i) => (
          <motion.div
            key={ab.slot + i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.05 }}
            className="flex gap-4 rounded-xl border border-border-subtle bg-bg-surface p-4"
          >
            <div className="w-12 h-12 rounded-lg bg-bg-elevated border border-border-subtle flex items-center justify-center shrink-0">
              {ab.display_icon && <img src={ab.display_icon} alt="" className="w-8 h-8 object-contain" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-text-primary text-sm font-medium">{ab.display_name}</span>
                <span className="text-text-muted text-[10px] uppercase tracking-wider">{ab.slot}</span>
              </div>
              <p className="text-text-secondary text-xs mt-1 leading-relaxed">{ab.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
