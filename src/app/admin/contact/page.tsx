// components/admin/ContactsPanel.tsx
"use client";

import React, { JSX, useEffect, useState } from "react";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

interface SupportMessage {
  support_id: number;
  subject: string;
  message: string;
  created_at: string;
  full_name: string;
  email: string;
  read?: boolean;
}

export default function ContactsPanel(): JSX.Element {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchMessages = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${BACKEND}/api/support/`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: SupportMessage[] = await res.json();

        if (!mounted) return;

        setMessages(
          data
            .slice()
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .map((m) => ({ ...m, read: false }))
        );
      } catch (err) {
        console.error("Failed to load support messages:", err);
        if (mounted) setError("Failed to load messages. Check server or network.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchMessages();
    return () => {
      mounted = false;
    };
  }, []);

  function markRead(id: number) {
    setMessages((prev) => prev.map((m) => (m.support_id === id ? { ...m, read: true } : m)));
    // Optional: persist to server if you have an endpoint
    // fetch(`${BACKEND}/api/support/${id}/read`, { method: 'PATCH' }).catch(console.error)
  }

  function removeMessage(id: number) {
    // optimistic UI remove
    setMessages((prev) => prev.filter((m) => m.support_id !== id));
    // Optional: delete on server
    // fetch(`${BACKEND}/api/support/${id}`, { method: 'DELETE' }).catch(console.error)
  }

  return (
    <section className="p-4">
            <h1 className="text-2xl py-5 text-center md:text-5xl lg:text-6xl font-bold mb-6">[support messages]</h1>

      {loading && <div className="text-slate-400">Loading messages...</div>}
      {error && <div className="text-sm text-rose-400 mb-3">{error}</div>}

      {!loading && messages.length === 0 && <div className="text-slate-400">No messages yet.</div>}

      <div className="space-y-3">
        {messages.map((m) => {
          const expanded = expandedId === m.support_id;
          return (
            <article
              key={m.support_id}
              className={`border rounded-lg p-4 bg-white/3 border-white/6 transition ${m.read ? "opacity-60" : "shadow-sm"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => setExpandedId((cur) => (cur === m.support_id ? null : m.support_id))}
                    className="w-full text-left"
                  >
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium truncate">{m.subject}</div>
                      <div className="text-xs text-slate-400">• {m.full_name}</div>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 truncate">
                      {m.email} • {new Date(m.created_at).toLocaleString()}
                    </div>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {!m.read && (
                    <button
                      onClick={() => markRead(m.support_id)}
                      className="px-2 py-1 text-xs rounded bg-emerald-500/20 border border-emerald-500 text-emerald-300"
                      aria-label={`Mark message ${m.support_id} as read`}
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    onClick={() => removeMessage(m.support_id)}
                    className="px-2 py-1 text-xs rounded bg-rose-500/10 border border-rose-500 text-rose-300"
                    aria-label={`Delete message ${m.support_id}`}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {expanded && (
                <div className="mt-3 text-slate-200 text-sm">
                  {m.message}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
