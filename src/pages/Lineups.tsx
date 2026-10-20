import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Map as MapIcon } from "lucide-react";
import { LINEUPS, type Lineup } from "../data/lineups";

const ALL_MAPS = [
  "Ascent",
  "Bind",
  "Breeze",
  "Fracture",
  "Haven",
  "Icebox",
  "Lotus",
  "Pearl",
  "Split",
  "Sunset",
];

const ALL_AGENTS = [
  "Astra",
  "Breach",
  "Brimstone",
  "Chamber",
  "Clove",
  "Cypher",
  "Deadlock",
  "Fade",
  "Gekko",
  "Harbor",
  "Iso",
  "Jett",
  "KAY/O",
  "Killjoy",
  "Neon",
  "Omen",
  "Phoenix",
  "Raze",
  "Reyna",
  "Sage",
  "Skye",
  "Sova",
  "Tejo",
  "Viper",
  "Vyse",
  "Waylay",
  "Yoru",
];

const AGENT_ABILITIES: Record<string, string[]> = {
  Astra: ["Nova Pulse", "Gravity Well", "Nebula"],
  Breach: ["Fault Line", "Flashpoint", "Aftershock"],
  Brimstone: ["Incendiary", "Sky Smoke", "Stim Beacon"],
  Chamber: ["Trademark", "Rendezvous"],
  Clove: ["Meddle", "Pick-me-up"],
  Cypher: ["Cyber Cage", "Spycam", "Tripwire"],
  Deadlock: ["GravNet", "Sonic Sensor", "Barrier Mesh"],
  Fade: ["Haunt", "Seize", "Prowler"],
  Gekko: ["Mosh Pit", "Wingman", "Dizzy"],
  Harbor: ["Cove", "High Tide", "Cascade"],
  Iso: ["Undercut", "Contingency", "Kill Contract"],
  Jett: ["Smoke Cloud", "Updraft"],
  "KAY/O": ["Zero/Point", "Fragment", "Flash/Drive"],
  Killjoy: ["Nanoswarm", "Alarmbot", "Turret"],
  Neon: ["Fast Lane", "Relay Bolt"],
  Omen: ["Shrouded Step", "Paranoia", "Dark Cover"],
  Phoenix: ["Blaze", "Curveball", "Hot Hands"],
  Raze: ["Paint Shells", "Boom Bot", "Blast Pack"],
  Reyna: ["Leer", "Devour"],
  Sage: ["Slow Orb", "Barrier Orb"],
  Skye: ["Trailblazer", "Guiding Light"],
  Sova: ["Recon Dart", "Shock Dart"],
  Tejo: ["Special Delivery", "Guided Salvo"],
  Viper: ["Snake Bite", "Toxic Screen", "Poison Cloud"],
  Vyse: ["Shear", "Arc Rose", "Razorvine"],
  Waylay: ["Refract", "Lightspeed"],
  Yoru: ["Gatecrash", "Fakeout"],
};

export default function Lineups() {
  const navigate = useNavigate();
  const [mapFilter, setMapFilter] = useState<string>("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [abilityFilter, setAbilityFilter] = useState<string>("all");

  // Reset ability when agent changes
  useEffect(() => {
    setAbilityFilter("all");
  }, [agentFilter]);

  const abilities =
    agentFilter !== "all" ? AGENT_ABILITIES[agentFilter] ?? [] : [];

  const results = LINEUPS.filter((l: Lineup) => {
    if (mapFilter !== "all" && l.map !== mapFilter) return false;
    if (agentFilter !== "all" && l.agent !== agentFilter) return false;
    if (abilityFilter !== "all" && l.ability !== abilityFilter) return false;
    return true;
  });

  return (
    <div className="p-6 max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
          Lineups
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Learn post-plant and execute lineups across every map.
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <Dropdown
          label="Map"
          value={mapFilter}
          options={ALL_MAPS}
          allLabel="All Maps"
          onChange={setMapFilter}
        />
        <Dropdown
          label="Agent"
          value={agentFilter}
          options={ALL_AGENTS}
          allLabel="All Agents"
          onChange={setAgentFilter}
        />
        {agentFilter !== "all" && abilities.length > 0 && (
          <Dropdown
            label="Ability"
            value={abilityFilter}
            options={abilities}
            allLabel="All Abilities"
            onChange={setAbilityFilter}
          />
        )}
      </div>

      {results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-dashed border-border-subtle text-center">
          <MapIcon size={32} className="text-text-muted mb-3" />
          <h2 className="text-text-primary font-medium">No lineups found</h2>
          <p className="text-text-muted text-sm mt-1 max-w-xs">
            Try a different map, agent, or ability.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {results.map((l, i) => (
            <motion.div
              key={l.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.03 }}
              className="flex flex-col rounded-xl border border-border-subtle bg-bg-surface p-4 hover:border-border-strong transition-colors"
            >
              <h3 className="text-text-primary font-medium text-sm leading-snug min-h-[2.5rem]">
                {l.title}
              </h3>

              <div className="mt-2 flex items-center gap-1.5 text-xs">
                <span className="text-text-secondary">{l.map}</span>
                <span className="text-text-muted">·</span>
                <span className="text-accent font-medium">{l.agent}</span>
              </div>

              <button
                onClick={() => navigate(`/lineups/${l.id}`)}
                className="mt-4 w-full px-3 py-1.5 rounded-md bg-bg-elevated border border-border-subtle hover:border-accent/40 hover:bg-accent/5 text-text-primary text-xs font-medium transition-colors"
              >
                View
              </button>
            </motion.div>
          ))}
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

function Dropdown({
  label,
  value,
  options,
  allLabel,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  allLabel: string;
  onChange: (v: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-1.5"
    >
      <span className="text-text-muted text-[10px] uppercase tracking-wider">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-[160px] px-3 py-2 rounded-md bg-bg-surface border border-border-subtle hover:border-border-strong focus:border-accent/50 outline-none text-text-primary text-sm transition-colors cursor-pointer"
      >
        <option value="all">{allLabel}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </motion.div>
  );
}
