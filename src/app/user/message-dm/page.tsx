// app/chat/page.tsx (or pages/chat.tsx)
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2, Menu, X } from "lucide-react";
import UserSidebar from "@/app/components/user/sidebar";
import { useRouter } from "next/navigation";
import { toast } from "sonner"; // optional, remove if you don't use sonner

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
// If you have a fixed management user id, set NEXT_PUBLIC_MANAGEMENT_ID in env
const MANAGEMENT_ID = Number(process.env.NEXT_PUBLIC_MANAGEMENT_ID || "1");

type Message = {
  id?: number | string;
  from_user_id: number;
  to_user_id: number;
  body: string;
  created_at?: string;
  is_read?: boolean;
};


export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [active, setActive] = useState("messages");
  const [userName, setUserName] = useState("Investor");
  const [userEmail, setUserEmail] = useState("");
  const [user, setUser] = useState<any | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [lastError, setLastError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  // read user from same localStorage key your NoticesPage uses
  useEffect(() => {
    if (typeof window !== "undefined") {
        
      const saved = localStorage.getItem("user");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setUser(parsed);
          setUserName(parsed?.name || "Investor");
          setUserEmail(parsed?.email || "");
        } catch {
          // ignore parse error
        }
      }
    }
  }, []);

  const currentUserId = user?.id ?? null;
  const managementId = MANAGEMENT_ID;

  function scrollToBottom() {
    try {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    } catch {}
  }

  // fetch messages: include userA and x-user-id header for server compatibility
  async function fetchMessages(signal?: AbortSignal) {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("user_id", String(managementId));
      if (currentUserId) params.set("userA", String(currentUserId));

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (currentUserId) headers["x-user-id"] = String(currentUserId);

      const res = await fetch(`${BACKEND}/api/messages?${params.toString()}`, { headers, signal });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Failed to load messages (${res.status}) ${txt}`);
      }
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
      setLastError(null);
      setTimeout(scrollToBottom, 50);
    } catch (err: any) {
      if (err.name === "AbortError") return;
      console.error("fetchMessages error:", err);
      setLastError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  // polling with cleanup
  useEffect(() => {
    const ac = new AbortController();
    fetchMessages(ac.signal);
    const id = setInterval(() => fetchMessages(), 3000);
    return () => {
      ac.abort();
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [managementId, currentUserId]);

  const isMine = (m: Message) => {
    if (currentUserId != null) return m.from_user_id === currentUserId;
    return m.from_user_id !== managementId;
  };

  async function handleSend() {
    if (!text.trim()) return;
    const body = text.trim();
    setText("");
    setSending(true);

    const tmpId = `tmp-${Date.now()}`;
    const tmpMsg: Message = {
      id: tmpId,
      from_user_id: currentUserId ?? -1,
      to_user_id: managementId,
      body,
      created_at: new Date().toISOString(),
    };

    setMessages((p) => [...p, tmpMsg]);
    scrollToBottom();

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (currentUserId) headers["x-user-id"] = String(currentUserId);

      const res = await fetch(`${BACKEND}/api/messages`, {
        method: "POST",
        headers,
        body: JSON.stringify({ to_user_id: managementId, body }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        const msg = json?.error || json?.message || `Failed to send (${res.status})`;
        throw new Error(msg);
      }

      const saved = await res.json(); // server should return saved message
      setMessages((prev) => prev.map((m) => (m.id === tmpId ? saved : m)));
      scrollToBottom();
    } catch (err: any) {
      console.error("send error:", err);
      toast?.error?.(`Failed to send message: ${err?.message || err}`); // optional
      // Mark temp message visually (simple approach)
      setMessages((prev) => prev.map((m) => (m.id === tmpId ? { ...m, body: `${m.body} (failed)` } : m)));
    } finally {
      setSending(false);
    }
  }

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!sending) handleSend();
    }
  };

  const handleNavChange = (id: string) => {
    if (id === "logout") {
      localStorage.removeItem("user");
      router.push("/login");
    } else {
      setActive(id);
    }
    setSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen text-slate-100 antialiased">
      {/* mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen((s) => !s)}
          className="p-2 rounded-lg bg-white/6 backdrop-blur text-slate-100"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-72 z-40 transform transition-transform duration-200
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <UserSidebar
          active={active}
          onChange={handleNavChange}
          userName={userName}
          userEmail={userEmail}
          onLogout={() => {
            localStorage.removeItem("user");
            router.push("/login");
          }}
        />
      </aside>

      {/* overlay */}
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-30 bg-black/40 md:hidden" />}

      {/* main content */}
      <main className="flex-1 p-6 md:ml-72">
        <h1 className="text-4xl py-5 text-center md:text-5xl lg:text-6xl font-bold mb-6">[messages]</h1>

        <div className="bg-white/4 rounded-2xl shadow-lg overflow-hidden border border-white/6 max-w-3xl mx-auto">
          <div className="flex items-center gap-3 p-4 border-b border-white/6">
            <div className="w-12 h-12 rounded-full bg-slate-700/20 flex items-center justify-center text-lg font-semibold">M</div>
            <div className="flex-1">
              <div className="font-semibold">Management</div>
              <div className="text-xs text-slate-400">Support team</div>
            </div>
          </div>

          <div ref={scrollRef} className="p-4 min-h-[300px] max-h-[60vh] overflow-y-auto space-y-3" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.02), transparent)" }}>
            {loading && <div className="flex items-center gap-2 text-slate-400"><Loader2 className="animate-spin" /> Loading messages...</div>}
            {!loading && lastError && <div className="text-rose-400 text-sm text-center py-4">Error: {lastError}</div>}
            {!loading && messages.length === 0 && !lastError && <div className="text-slate-400 text-center py-8">No messages yet — say hello 👋</div>}

            {messages.map((m) => {
              const mine = isMine(m);
              return (
                <div key={String(m.id)} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm break-words ${mine ? "bg-white/7 text-black" : "bg-white/5 text-slate-900"}`}>
                    <div className="whitespace-pre-wrap">{m.body}</div>
                    <div className="text-xs text-slate-400 mt-2 text-right">{m.created_at ? new Date(m.created_at).toLocaleString() : ""}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 border-t border-white/6">
            <div className="flex items-center gap-3">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write your message to management (Enter to send, Shift+Enter for newline)"
                className="flex-1 min-h-[48px] max-h-40 resize-none rounded-2xl p-3 bg-white/5 text-sm"
              />
              <div className="flex flex-col gap-2">
                <button onClick={handleSend} disabled={sending || !text.trim()} className="px-4 py-2 rounded-2xl bg-amber-400 text-black font-semibold disabled:opacity-60">
                  {sending ? "Sending…" : "Send"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
