import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import ChatBubble from "./ChatBubble";

export default function AppShell() {
  return (
    <div className="h-full w-full flex bg-bg-base relative">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <ChatBubble />
    </div>
  );
}
