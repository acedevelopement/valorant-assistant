import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check } from "lucide-react";
import { CROSSHAIRS, type Crosshair } from "../data/crosshairs";
import CrosshairPreview from "../components/CrosshairPreview";

export default function Crosshairs() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (c: Crosshair) => {
    try {
      await navigator.clipboard.writeText(c.code);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = c.code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiedId(c.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="p-6 max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
          Crosshairs
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Copy a code, paste it in-game via Settings → Crosshair → Import.
        </p>
      </div>

      {CROSSHAIRS.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-dashed border-border-subtle text-center">
          <h2 className="text-text-primary font-medium">No crosshairs yet</h2>
          <p className="text-text-muted text-sm mt-1 max-w-xs">
            Your collection will appear here.
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {CROSSHAIRS.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
            className="flex flex-col rounded-xl border border-border-subtle bg-bg-surface overflow-hidden hover:border-border-strong transition-colors"
          >
            <div className="aspect-square bg-black flex items-center justify-center border-b border-border-subtle p-6">
              <CrosshairPreview code={c.code} />
            </div>

            <div className="p-4 flex-1 flex flex-col">
              <div className="flex items-baseline justify-between mb-1">
                <h3 className="text-text-primary font-medium text-sm">
                  {c.name}
                </h3>
                <span className="text-text-muted text-[10px] uppercase tracking-wider">
                  {c.author}
                </span>
              </div>

              <div className="flex flex-wrap gap-1 mt-1 mb-3">
                {c.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] text-text-muted bg-bg-elevated px-1.5 py-0.5 rounded"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <div className="mt-auto">
                <code className="block text-[10px] text-text-muted font-mono truncate mb-2 bg-bg-base px-2 py-1 rounded border border-border-subtle">
                  {c.code}
                </code>
                <button
                  onClick={() => handleCopy(c)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-bg-elevated border border-border-subtle hover:border-accent/40 hover:bg-accent/5 text-text-primary text-xs font-medium transition-colors"
                >
                  {copiedId === c.id ? (
                    <>
                      <Check size={12} className="text-win" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      Copy Code
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

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
