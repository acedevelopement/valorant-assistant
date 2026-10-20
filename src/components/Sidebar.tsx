import { NavLink } from "react-router-dom";
import {
  
  LayoutDashboard,
  BarChart3,
  Gamepad2,
  Users,
  Sword,
  Map,
  Crosshair,
  Trophy,
  LineChart,
  Heart,
  Settings,
} from "lucide-react";
import { cn } from "../lib/utils";

const navItems = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  
  { to: "/stats", label: "Stats", icon: BarChart3 },
  { to: "/matches", label: "Matches", icon: Gamepad2 },
  { to: "/players", label: "Players", icon: Users },
  { to: "/agents", label: "Agents", icon: Sword },
  { to: "/lineups", label: "Lineups", icon: Map },
  { to: "/crosshairs", label: "Crosshairs", icon: Crosshair },
  { to: "/tournaments", label: "Tournaments", icon: Trophy },
  { to: "/leaderboards", label: "Leaderboards", icon: Trophy },
  { to: "/analytics", label: "Analytics", icon: LineChart },
  { to: "/credits", label: "Credits", icon: Heart },
];

export default function Sidebar() {
  return (
    <aside className="w-60 h-full bg-bg-surface border-r border-border-subtle flex flex-col">
      <div className="px-5 py-5 border-b border-border-subtle">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-md overflow-hidden border border-accent/20 shadow-[0_0_20px_var(--color-accent-dim)] shrink-0 bg-bg-base">
            <img
              src={new URL("../assets/logo.png", import.meta.url).href}
              alt="Valorant Buddy"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="leading-tight">
            <div className="text-text-primary font-semibold text-sm tracking-tight">
              Valorant Buddy
            </div>
            <div className="text-text-muted text-[10px] uppercase tracking-wider">
              v0.1
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 px-3 py-2 rounded-md text-sm mb-0.5 transition-all duration-150 relative",
                isActive
                  ? "bg-bg-elevated text-text-primary"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated/60"
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-accent rounded-r-full shadow-[0_0_8px_var(--color-accent)]" />
                )}
                <item.icon
                  size={16}
                  strokeWidth={2}
                  className={cn(
                    "transition-colors",
                    isActive
                      ? "text-accent"
                      : "text-text-muted group-hover:text-text-secondary"
                  )}
                />
                <span className="font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-2 border-t border-border-subtle">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              "group flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-150 relative",
              isActive
                ? "bg-bg-elevated text-text-primary"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated/60"
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-accent rounded-r-full shadow-[0_0_8px_var(--color-accent)]" />
              )}
              <Settings
                size={16}
                strokeWidth={2}
                className={cn(
                  "transition-colors",
                  isActive
                    ? "text-accent"
                    : "text-text-muted group-hover:text-text-secondary"
                )}
              />
              <span className="font-medium">Settings</span>
            </>
          )}
        </NavLink>
      </div>
    </aside>
  );
}
