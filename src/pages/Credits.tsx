import { motion } from "framer-motion";
import { Heart, Code2, TestTube2, ExternalLink } from "lucide-react";

const PATREON_URL = "https://patreon.com/YOUR_PATREON_HANDLE";

export default function Credits() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
          Credits
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          The people behind Valorant Buddy.
        </p>
      </motion.div>

      {/* Developer */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
        className="rounded-xl border border-border-strong bg-bg-surface p-5"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-md bg-accent/10 border border-accent/30 flex items-center justify-center">
            <Code2 size={14} className="text-accent" />
          </div>
          <h2 className="text-text-primary text-sm font-semibold uppercase tracking-wider">
            Developer
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-bg-elevated border border-border-strong flex items-center justify-center">
            <span className="text-accent text-sm font-bold">MA</span>
          </div>
          <div>
            <div className="text-text-primary text-sm font-medium">
              Mahad Ansar
            </div>
            <div className="text-text-muted text-xs">
              Ace Development
            </div>
          </div>
        </div>
      </motion.div>

      {/* Testers */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        className="rounded-xl border border-border-strong bg-bg-surface p-5"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-md bg-accent/10 border border-accent/30 flex items-center justify-center">
            <TestTube2 size={14} className="text-accent" />
          </div>
          <h2 className="text-text-primary text-sm font-semibold uppercase tracking-wider">
            Testers
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-subtle">
            <div className="w-9 h-9 rounded-md bg-bg-base border border-border-strong flex items-center justify-center">
              <span className="text-text-secondary text-xs font-bold">IG</span>
            </div>
            <div>
              <div className="text-text-primary text-sm font-medium">IGNIS</div>
              <div className="text-text-muted text-[11px]">QA Testing</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border-subtle">
            <div className="w-9 h-9 rounded-md bg-bg-base border border-border-strong flex items-center justify-center">
              <span className="text-text-secondary text-xs font-bold">VE</span>
            </div>
            <div>
              <div className="text-text-primary text-sm font-medium">VESPER</div>
              <div className="text-text-muted text-[11px]">QA Testing</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Patreon */}
      <motion.a
        href={PATREON_URL}
        target="_blank"
        rel="noreferrer"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        className="group block relative overflow-hidden rounded-xl border border-accent/30 bg-gradient-to-br from-accent/10 via-accent/5 to-transparent p-5 hover:border-accent/60 transition-colors"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-accent/15 border border-accent/40 flex items-center justify-center shrink-0">
            <Heart size={20} className="text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-text-primary text-sm font-semibold">
                Support on Patreon
              </h2>
              <ExternalLink
                size={12}
                className="text-text-muted group-hover:text-accent transition-colors"
              />
            </div>
            <p className="text-text-secondary text-xs mt-1">
              Help keep Valorant Buddy free and updated.
            </p>
          </div>
        </div>
      </motion.a>

      <div className="pt-6 pb-2 text-center">
        <p className="text-text-muted text-xs">
          Valorant Buddy v0.1 · Made with{" "}
          <span className="text-accent">♥</span> by{" "}
          <span className="text-text-secondary font-medium">Ace Development</span>
        </p>
      </div>
    </div>
  );
}
