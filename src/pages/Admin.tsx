import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Lock, LogOut, Plus, Trash2, Save } from "lucide-react";
import {
  adminLogin,
  adminLogout,
  adminIsAuthenticated,
  getLocalTournaments,
  saveLocalTournaments,
  type LocalTournament,
} from "../lib/admin";

export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [tournaments, setTournaments] = useState<LocalTournament[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    adminIsAuthenticated()
      .then((a) => {
        setAuthed(a);
        if (a) loadTournaments();
      })
      .finally(() => setChecking(false));
  }, []);

  const loadTournaments = async () => {
    try {
      const list = await getLocalTournaments();
      setTournaments(list);
    } catch {
      setTournaments([]);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await adminLogin(username, password);
      if (res.success) {
        setAuthed(true);
        setPassword("");
        await loadTournaments();
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    await adminLogout();
    setAuthed(false);
    setUsername("");
    setPassword("");
  };

  const addTournament = () => {
    const blank: LocalTournament = {
      id: `t-${Date.now()}`,
      title: "New Tournament",
      organizer: "Ace Development",
      region: "MENA",
      server: "",
      prize_pool: "",
      max_teams: 8,
      registration_opens: new Date().toISOString(),
      registration_closes: new Date(Date.now() + 7 * 86400000).toISOString(),
      start_time: new Date(Date.now() + 14 * 86400000).toISOString(),
      duration_hours: 4,
      description: "",
      links: [],
      banner_url: null,
    };
    setTournaments([blank, ...tournaments]);
  };

  const updateTournament = (idx: number, patch: Partial<LocalTournament>) => {
    setTournaments(
      tournaments.map((t, i) => (i === idx ? { ...t, ...patch } : t))
    );
  };

  const removeTournament = (idx: number) => {
    setTournaments(tournaments.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setBusy(true);
    setError(null);
    try {
      await saveLocalTournaments(tournaments);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <motion.form
          onSubmit={handleLogin}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm rounded-xl border border-border-strong bg-bg-surface p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-md bg-accent/10 border border-accent/30 flex items-center justify-center">
              <Lock size={15} className="text-accent" />
            </div>
            <div>
              <h1 className="text-text-primary font-semibold text-sm">
                Admin Sign In
              </h1>
              <p className="text-text-muted text-[11px] mt-0.5">
                Restricted access
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-text-secondary text-xs">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                className="mt-1 w-full px-3 py-2 rounded-md bg-bg-elevated border border-border-subtle focus:border-accent/50 outline-none text-text-primary text-sm"
              />
            </div>
            <div>
              <label className="text-text-secondary text-xs">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-md bg-bg-elevated border border-border-subtle focus:border-accent/50 outline-none text-text-primary text-sm"
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 px-3 py-2 rounded-md bg-loss/10 border border-loss/30 text-loss text-xs">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-5 w-full px-4 py-2 rounded-md bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors disabled:opacity-50 shadow-[0_0_20px_var(--color-accent-dim)]"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </motion.form>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
            Admin Panel
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Post tournaments locally. They appear on your Tournaments page.
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-bg-surface border border-border-subtle hover:border-loss/40 hover:text-loss text-text-secondary text-xs transition-colors"
        >
          <LogOut size={12} />
          Sign out
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={addTournament}
          className="flex items-center gap-2 px-3 py-2 rounded-md bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors"
        >
          <Plus size={13} />
          Add tournament
        </button>
        <button
          onClick={handleSave}
          disabled={busy}
          className="flex items-center gap-2 px-3 py-2 rounded-md bg-bg-surface border border-border-subtle hover:border-border-strong text-text-secondary hover:text-text-primary text-xs transition-colors disabled:opacity-50"
        >
          <Save size={13} />
          {busy ? "Saving…" : "Save all"}
        </button>
        {saved && (
          <span className="self-center text-win text-xs">Saved.</span>
        )}
      </div>

      {error && (
        <div className="px-3 py-2 rounded-md bg-loss/10 border border-loss/30 text-loss text-xs">
          {error}
        </div>
      )}

      {tournaments.length === 0 && (
        <div className="text-center py-16 text-text-muted text-sm">
          No tournaments yet. Click "Add tournament" to create one.
        </div>
      )}

      <div className="space-y-4">
        {tournaments.map((t, idx) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border-subtle bg-bg-surface p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <input
                value={t.title}
                onChange={(e) => updateTournament(idx, { title: e.target.value })}
                className="flex-1 bg-transparent text-text-primary font-medium text-base outline-none border-b border-transparent focus:border-border-strong pb-0.5"
              />
              <button
                onClick={() => removeTournament(idx)}
                className="text-text-muted hover:text-loss transition-colors shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Field label="Organizer" value={t.organizer} onChange={(v) => updateTournament(idx, { organizer: v })} />
              <Field label="Region" value={t.region} onChange={(v) => updateTournament(idx, { region: v })} />
              <Field label="Server" value={t.server} onChange={(v) => updateTournament(idx, { server: v })} />
              <Field label="Prize pool" value={t.prize_pool} onChange={(v) => updateTournament(idx, { prize_pool: v })} />
              <Field
                label="Max teams"
                value={String(t.max_teams)}
                onChange={(v) => updateTournament(idx, { max_teams: parseInt(v) || 0 })}
              />
              <Field
                label="Duration (hours)"
                value={String(t.duration_hours)}
                onChange={(v) => updateTournament(idx, { duration_hours: parseInt(v) || 0 })}
              />
              <Field
                label="Reg opens (ISO)"
                value={t.registration_opens}
                onChange={(v) => updateTournament(idx, { registration_opens: v })}
              />
              <Field
                label="Reg closes (ISO)"
                value={t.registration_closes}
                onChange={(v) => updateTournament(idx, { registration_closes: v })}
              />
              <Field
                label="Start time (ISO)"
                value={t.start_time}
                onChange={(v) => updateTournament(idx, { start_time: v })}
              />
            </div>

            <textarea
              value={t.description}
              onChange={(e) => updateTournament(idx, { description: e.target.value })}
              placeholder="Description"
              rows={2}
              className="w-full px-2 py-1.5 rounded-md bg-bg-base border border-border-subtle focus:border-accent/50 outline-none text-text-primary text-xs resize-none"
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-text-muted text-[10px] uppercase tracking-wider">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-2 py-1.5 rounded-md bg-bg-base border border-border-subtle focus:border-accent/50 outline-none text-text-primary text-xs"
      />
    </div>
  );
}
