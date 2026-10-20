import { useState, useEffect } from "react";
import { Search, Bell, Minus, Square, X } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import PlayerSearch from "./PlayerSearch";
import UserMenu from "./UserMenu";

export default function Topbar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const minimize = async () => {
    await getCurrentWindow().minimize();
  };

  const toggleMaximize = async () => {
    const w = getCurrentWindow();
    const isMax = await w.isMaximized();
    if (isMax) {
      await w.unmaximize();
    } else {
      await w.maximize();
    }
  };

  const close = async () => {
    await getCurrentWindow().close();
  };

  return (
    <>
      <header className="h-14 border-b border-border-subtle bg-bg-base/80 backdrop-blur-sm flex items-center px-5 gap-4">
        {/* Left: search */}
        <div className="flex-1 max-w-md" data-tauri-drag-region>
          <button
            onClick={() => setOpen(true)}
            data-tauri-drag-region="false"
            className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md bg-bg-surface border border-border-subtle hover:border-border-strong transition-colors text-left group"
          >
            <Search size={14} className="text-text-muted" />
            <span className="text-text-muted text-sm flex-1">
              Search players…
            </span>
            <kbd className="text-[10px] text-text-muted bg-bg-elevated px-1.5 py-0.5 rounded border border-border-subtle font-mono">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Middle: draggable spacer */}
        <div className="flex-1 h-full" data-tauri-drag-region />

        {/* Right: bell + user + window controls */}
        <div className="flex items-center gap-2">
          <button
            data-tauri-drag-region="false"
            className="w-8 h-8 rounded-md hover:bg-bg-elevated transition-colors flex items-center justify-center text-text-secondary hover:text-text-primary"
          >
            <Bell size={16} />
          </button>

          <div data-tauri-drag-region="false">
            <UserMenu />
          </div>

          {/* Window controls */}
          <div className="flex items-center ml-1 -mr-2">
            <button
              onClick={minimize}
              data-tauri-drag-region="false"
              className="w-10 h-10 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
            >
              <Minus size={14} />
            </button>
            <button
              onClick={toggleMaximize}
              data-tauri-drag-region="false"
              className="w-10 h-10 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
            >
              <Square size={11} />
            </button>
            <button
              onClick={close}
              data-tauri-drag-region="false"
              className="w-10 h-10 flex items-center justify-center text-text-secondary hover:text-white hover:bg-loss transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </header>
      {open && <PlayerSearch onClose={() => setOpen(false)} />}
    </>
  );
}
