import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppShell from "./components/AppShell";
import SplashScreen from "./components/SplashScreen";
import Overview from "./pages/Overview";

import Lineups from "./pages/Lineups";
import LineupDetail from "./pages/LineupDetail";
import Crosshairs from "./pages/Crosshairs";
import Agents from "./pages/Agents";
import AgentDetail from "./pages/AgentDetail";
import Matches from "./pages/Matches";
import PlayerProfile from "./pages/PlayerProfile";
import MatchDetailPage from "./pages/MatchDetail";
import Tournaments from "./pages/Tournaments";
import Admin from "./pages/Admin";
import Credits from "./pages/Credits";
import Settings from "./pages/Settings";
import Placeholder from "./pages/Placeholder";

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <>
      {!splashDone && (
        <SplashScreen onComplete={() => setSplashDone(true)} />
      )}

      {splashDone && (
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<Overview />} />
              
              <Route path="stats" element={<Placeholder title="Stats" />} />
              <Route path="matches" element={<Matches />} />
              <Route path="players" element={<Placeholder title="Players" />} />
              <Route
                path="players/:region/:name/:tag"
                element={<PlayerProfile />}
              />
              <Route
                path="players/:region/:name/:tag/match/:matchId"
                element={<MatchDetailPage />}
              />
              <Route path="agents" element={<Agents />} />
              <Route path="agents/:id" element={<AgentDetail />} />
              <Route path="lineups" element={<Lineups />} />
              <Route path="lineups/:id" element={<LineupDetail />} />
              <Route path="crosshairs" element={<Crosshairs />} />
              <Route path="tournaments" element={<Tournaments />} />
              <Route path="admin" element={<Admin />} />
              <Route
                path="leaderboards"
                element={<Placeholder title="Leaderboards" />}
              />
              <Route
                path="analytics"
                element={<Placeholder title="Analytics" />}
              />
              <Route path="credits" element={<Credits />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      )}
    </>
  );
}
