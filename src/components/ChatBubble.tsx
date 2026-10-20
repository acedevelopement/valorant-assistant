import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { aiChat, type ChatMessage } from "../lib/ai";

const SYSTEM_PROMPT: ChatMessage = {
  role: "system",
  content:
    "You are Valorant Buddy, an AI assistant inside a Windows desktop Valorant companion app. " +
    "You help players understand their stats, improve their gameplay, and learn lineups and strategies. " +
    "Be concise, helpful, and use Valorant terminology.\n\n" +
    "IMPORTANT FACTS ABOUT THIS APP:\n" +
    "- The app is called 'Valorant Buddy'.\n" +
    "- It was developed by 'Ace Development', led by 'Mahad Ansar'.\n" +
    "- If a user asks who made the app, who the developer is, or anything similar, " +
    "you must answer: 'Valorant Buddy was developed by Ace Development, led by Mahad Ansar.'\n" +
    "- Never claim you were made by Google, OpenAI, or any other company. You are Valorant Buddy.\n" +
    "- The app includes: Overview, Live Match, Matches, Player Search, Agent Browser, " +
    "Lineups, Crosshairs, Tournaments, and Analytics.\n" +
    "- You do not have access to the user's real match data, rank, or stats. If asked, " +
    "say you can't see that data yet and suggest they check the Overview page.",
};

export default function ChatBubble() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const history = [SYSTEM_PROMPT, ...next];
      const reply = await aiChat(history);
      setMessages([...next, { role: "assistant", content: reply }]);
      if (!open) setUnread((u) => u + 1);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const openChat = () => {
    setOpen(true);
    setUnread(0);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-24 right-6 z-40 w-[400px] h-[600px] rounded-xl bg-bg-surface border border-border-strong shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-bg-surface shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-accent/10 border border-accent/30 flex items-center justify-center">
                  <Bot size={14} className="text-accent" />
                </div>
                <div className="leading-tight">
                  <div className="text-text-primary font-semibold text-sm">
                    Valorant Buddy
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-win" />
                    <span className="text-text-muted text-[10px]">Online</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-md hover:bg-bg-elevated flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className="w-12 h-12 rounded-xl bg-bg-elevated border border-border-subtle flex items-center justify-center mb-3">
                    <Bot size={20} className="text-text-muted" />
                  </div>
                  <h3 className="text-text-primary font-medium text-sm">
                    How can I help?
                  </h3>
                  <p className="text-text-muted text-xs mt-1 max-w-[240px]">
                    Ask about your stats, agents, or strategies.
                  </p>
                  <div className="mt-4 space-y-1.5 w-full">
                    {[
                      "What should I practice?",
                      "Explain Sova lineups",
                      "Who made this app?",
                    ].map((s) => (
                      <button
                        key={s}
                        onClick={() => setInput(s)}
                        className="w-full text-left px-3 py-2 rounded-md bg-bg-elevated border border-border-subtle hover:border-border-strong text-text-secondary hover:text-text-primary text-xs transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={
                    "flex gap-2 " +
                    (m.role === "user" ? "justify-end" : "justify-start")
                  }
                >
                  {m.role === "assistant" && (
                    <div className="w-6 h-6 rounded-md bg-accent/10 border border-accent/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot size={11} className="text-accent" />
                    </div>
                  )}
                  <div
                    className={
                      "max-w-[80%] px-3 py-2 rounded-lg text-[13px] leading-relaxed whitespace-pre-wrap " +
                      (m.role === "user"
                        ? "bg-accent text-white rounded-br-sm"
                        : "bg-bg-elevated border border-border-subtle text-text-primary rounded-bl-sm")
                    }
                  >
                    {m.content}
                  </div>
                  {m.role === "user" && (
                    <div className="w-6 h-6 rounded-md bg-bg-elevated border border-border-strong flex items-center justify-center shrink-0 mt-0.5">
                      <User size={11} className="text-text-secondary" />
                    </div>
                  )}
                </motion.div>
              ))}

              {loading && (
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-md bg-accent/10 border border-accent/30 flex items-center justify-center shrink-0">
                    <Bot size={11} className="text-accent" />
                  </div>
                  <div className="px-3 py-2.5 rounded-lg bg-bg-elevated border border-border-subtle rounded-bl-sm">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" />
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce"
                        style={{ animationDelay: "0.15s" }}
                      />
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce"
                        style={{ animationDelay: "0.3s" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="text-center">
                  <div className="inline-block px-3 py-2 rounded-md bg-loss/10 border border-loss/30 text-loss text-[11px] max-w-full">
                    {error.length > 120 ? error.slice(0, 120) + "…" : error}
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            <div className="px-3 py-3 border-t border-border-subtle bg-bg-surface shrink-0">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Type a message…"
                  rows={1}
                  className="flex-1 px-3 py-2 rounded-md bg-bg-elevated border border-border-subtle focus:border-accent/50 outline-none text-text-primary text-[13px] resize-none max-h-24 placeholder:text-text-muted"
                />
                <button
                  onClick={send}
                  disabled={!input.trim() || loading}
                  className="w-9 h-9 rounded-md bg-accent hover:bg-accent-hover disabled:opacity-40 flex items-center justify-center text-white transition-colors shrink-0"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={open ? () => setOpen(false) : openChat}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-accent hover:bg-accent-hover flex items-center justify-center text-white shadow-[0_8px_30px_rgba(255,70,85,0.4)] transition-colors"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X size={22} />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageCircle size={22} />
            </motion.div>
          )}
        </AnimatePresence>

        {unread > 0 && !open && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-white text-accent text-[11px] font-bold flex items-center justify-center border-2 border-accent"
          >
            {unread > 9 ? "9+" : unread}
          </motion.span>
        )}
      </motion.button>
    </>
  );
}
