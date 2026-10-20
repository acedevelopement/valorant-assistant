import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { User, Lock, LogOut, Shield } from "lucide-react";
import { adminIsAuthenticated, adminLogout } from "../lib/admin";

export default function UserMenu() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    adminIsAuthenticated().then(setAuthed).catch(() => setAuthed(false));
  }, [open]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, []);

  const handleSignIn = () => {
    setOpen(false);
    navigate("/admin");
  };

  const handleAdminPanel = () => {
    setOpen(false);
    navigate("/admin");
  };

  const handleSignOut = async () => {
    await adminLogout();
    setAuthed(false);
    setOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-md hover:bg-bg-elevated transition-colors"
      >
        <div
          className={
            "w-7 h-7 rounded-md border flex items-center justify-center " +
            (authed
              ? "bg-accent/15 border-accent/40"
              : "bg-bg-elevated border-border-strong")
          }
        >
          {authed ? (
            <Shield size={13} className="text-accent" />
          ) : (
            <User size={14} className="text-text-secondary" />
          )}
        </div>
        <div className="text-left leading-tight">
          <div className="text-text-primary text-xs font-medium">
            {authed ? "Admin" : "Not signed in"}
          </div>
          <div className="text-text-muted text-[10px]">
            {authed ? "Signed in" : "Click to sign in"}
          </div>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-border-strong bg-bg-surface shadow-2xl overflow-hidden z-50"
          >
            {!authed ? (
              <button
                onClick={handleSignIn}
                className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-bg-elevated text-text-secondary hover:text-text-primary text-xs transition-colors"
              >
                <Lock size={12} />
                Sign in
              </button>
            ) : (
              <>
                <button
                  onClick={handleAdminPanel}
                  className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-bg-elevated text-text-secondary hover:text-text-primary text-xs transition-colors"
                >
                  <Shield size={12} />
                  Admin Panel
                </button>
                <div className="h-px bg-border-subtle" />
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-loss/5 text-text-secondary hover:text-loss text-xs transition-colors"
                >
                  <LogOut size={12} />
                  Sign out
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
