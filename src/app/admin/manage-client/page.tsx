"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState, JSX } from "react";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

type Customer = {
  user_id: number;
  full_name: string;
  email: string;
  phone?: string | null;
  profile_image?: string | null;
  is_active?: number | boolean;
  created_at?: string | null;
  updated_at?: string | null;
  firebase_uid?: string | null;
  password_hash?: string | null;
};

type Message = {
  id?: number | string;
  from_user_id: number;
  to_user_id: number;
  body: string;
  created_at?: string;
};

export default function ClientsPanel(): JSX.Element {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selected, setSelected] = useState<Customer | null>(null);

  // chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatUser, setChatUser] = useState<Customer | null>(null);
  const [chatMessages, setChatMessages] = useState<Record<number, Message[]>>({});
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const msgRef = useRef<HTMLDivElement | null>(null);

  // Fetch customers
  useEffect(() => {
    let mounted = true;
    const ac = new AbortController();

    const fetchCustomers = async () => {
      try {
        setLoading(true);
        setError(null);
        const url = new URL(`${BACKEND}/api/customers`);
        url.searchParams.set("limit", "1000");
        url.searchParams.set("offset", "0");

        const res = await fetch(url.toString(), { signal: ac.signal });
        if (!res.ok) {
          const body = await res.text().catch(() => null);
          throw new Error(`Failed to load customers: ${res.status} ${body ?? res.statusText}`);
        }
        const json = await res.json();
        const arr: Customer[] = Array.isArray(json) ? json : json?.data ?? json?.customers ?? [];
        if (!mounted) return;
        setCustomers(Array.isArray(arr) ? arr : []);
      } catch (err: unknown) {
          if (err instanceof Error) {
            if (mounted) setError(err.message || "Failed to fetch customers");
          } else {
            console.error("Unexpected error:", err);
            if (mounted) setError("Failed to fetch customers");
          }
        } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchCustomers();
    return () => {
      mounted = false;
      ac.abort();
    };
  }, []);

  // filtering
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter((c) => {
      const name = (c.full_name || "").toLowerCase();
      const email = (c.email || "").toLowerCase();
      const phone = (c.phone || "").toLowerCase();
      return name.includes(term) || email.includes(term) || phone.includes(term);
    });
  }, [customers, query]);

  // paging
  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / limit));
  const pageData = useMemo(() => {
    const start = (page - 1) * limit;
    return filtered.slice(start, start + limit);
  }, [filtered, page, limit]);

  // helpers
  const formatDate = (d?: string | null) => (d ? new Date(d).toLocaleString() : "-");
  const initials = (name?: string) =>
    (name ? name.split(" ").map((s) => s[0]).join("").slice(0, 2) : "U").toUpperCase();

  // reset page on query/limit change
  useEffect(() => setPage(1), [query, limit]);

  // chat helpers
  const scrollToBottom = () => {
    try {
      if (msgRef.current) {
        msgRef.current.scrollTop = msgRef.current.scrollHeight;
      }
    } catch (e) {
      /* ignore */
    }
  };

  useEffect(() => {
    // when chatUser changes, load their messages
    if (chatUser) {
      loadMessages(chatUser.user_id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatUser]);

  useEffect(() => scrollToBottom(), [chatMessages, chatOpen]);

  const loadMessages = async (userId: number) => {
    // if already loaded don't force reload (but you can change this behaviour)
    if (chatMessages[userId]?.length) return;
    try {
      const res = await fetch(`${BACKEND}/api/messages?user_id=${userId}`);
      if (!res.ok) throw new Error("Failed to load messages");
      const json = await res.json();
      const arr: Message[] = Array.isArray(json) ? json : json?.data ?? json?.messages ?? [];
      setChatMessages((prev) => ({ ...prev, [userId]: arr }));
    } catch (err) {
      console.warn("Could not load messages, starting empty", err);
      setChatMessages((prev) => ({ ...prev, [userId]: [] }));
    }
  };

  const openChat = (user: Customer) => {
    setChatUser(user);
    setChatOpen(true);
  };

  const closeChat = () => {
    setChatOpen(false);
    setChatUser(null);
    setNewMessage("");
  };

  const sendMessage = async () => {
    if (!chatUser || !newMessage.trim()) return;
    const toId = chatUser.user_id;
    const fakeId = `tmp-${Date.now()}`;
    const meId = 0; // NOTE: replace with real admin/user id if available in your app
    const msg: Message = {
      id: fakeId,
      from_user_id: meId,
      to_user_id: toId,
      body: newMessage.trim(),
      created_at: new Date().toISOString(),
    };

    // optimistic update
    setChatMessages((prev) => {
      const prevList = prev[toId] ?? [];
      return { ...prev, [toId]: [...prevList, msg] };
    });
    setNewMessage("");
    setSending(true);
    scrollToBottom();

    try {
      // POST to backend
      const res = await fetch(`${BACKEND}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to_user_id: toId, body: msg.body }),
      });
      if (!res.ok) throw new Error("send failed");
      const saved = await res.json();
      // replace temporary id with server id (if returned)
      setChatMessages((prev) => {
        const list = prev[toId] ?? [];
        return {
          ...prev,
          [toId]: list.map((m) => (m.id === fakeId && saved?.id ? { ...m, id: saved.id } : m)),
        };
      });
    } catch (err) {
      console.error("Failed to send message", err);
      // mark as failed - in this example we'll leave it but you could add a 'failed' flag
    } finally {
      setSending(false);
      scrollToBottom();
    }
  };

  // send on Enter (without shift)
  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold"></h1>
        <h1 className="text-2xl py-5 text-center md:text-5xl lg:text-6xl font-bold mb-6">[client records]</h1>

        <div className="flex gap-2 items-center">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email or phone..."
            className="px-3 py-2 rounded-xl bg-white/5 placeholder:text-slate-400 text-sm"
          />
          <button
            onClick={() => {
              const rows = customers.map((c) => ({
                user_id: c.user_id,
                full_name: c.full_name,
                email: c.email,
                phone: c.phone,
                is_active: c.is_active,
                created_at: c.created_at,
              }));
              const csv = [
                Object.keys(rows[0] || {}).join(","),
                ...rows.map((r) => Object.values(r).map((v) => `"${String(v ?? "")}"`).join("")),
              ].join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="px-3 py-2 rounded-xl bg-white/6 text-sm"
          >
            Export
          </button>
        </div>
      </div>

      <div className="bg-white/3 rounded-2xl p-4 overflow-x-auto shadow-sm">
        {loading ? (
          <div className="py-8 text-center text-slate-400">Loading customers…</div>
        ) : error ? (
          <div className="py-8 text-center text-rose-400">{error}</div>
        ) : (
          <>
            <table className="w-full text-sm table-auto">
              <thead className="text-slate-300 text-left">
                <tr>
                  <th className="py-2">Profile</th>
                  <th className="py-2">Name</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Phone</th>
                  <th className="py-2">Joined</th>
                  <th className="py-2">Active</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((c) => (
                  <tr key={c.user_id} className="border-t border-white/6 hover:bg-white/2">
                    <td className="py-3">
                      {c.profile_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.profile_image}
                          alt={c.full_name || "profile"}
                          className="w-10 h-10 rounded-full object-cover border border-white/10"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-700/30 flex items-center justify-center text-white font-medium">
                          {initials(c.full_name)}
                        </div>
                      )}
                    </td>

                    <td className="py-3">{c.full_name || "—"}</td>
                    <td className="py-3 text-slate-300">{c.email || "—"}</td>
                    <td className="py-3 text-slate-300">{c.phone || "—"}</td>
                    <td className="py-3 text-slate-300">{formatDate(c.created_at)}</td>
                    <td className="py-3 text-slate-300">{c.is_active ? "Yes" : "No"}</td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setSelected(c)} className="px-3 py-1 rounded-lg bg-white/6 text-sm">
                          View
                        </button>
                        <button
                          onClick={() => {
                            setCustomers((prev) =>
                              prev.map((p) => (p.user_id === c.user_id ? { ...p, is_active: p.is_active ? 0 : 1 } : p))
                            );
                          }}
                          className="px-3 py-1 rounded-lg bg-white/6 text-sm"
                        >
                          Toggle
                        </button>

                        {/* Direct message (DM) button */}
                        <button
                          onClick={() => openChat(c)}
                          className="px-3 py-1 rounded-lg bg-white/6 text-sm"
                          title={`Send DM to ${c.full_name}`}
                        >
                          DM
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {pageData.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No clients found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-slate-400 text-sm">{filtered.length} clients</div>
              <div className="flex gap-2 items-center">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1 rounded bg-white/5">
                  Prev
                </button>
                <div className="px-3 py-1 rounded bg-white/5">{page}</div>
                <button onClick={() => setPage((p) => Math.min(pages, p + 1))} className="px-3 py-1 rounded bg-white/5">
                  Next
                </button>
                <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="ml-2 px-2 rounded bg-white/5">
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                </select>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4 z-50">
          <div className="bg-white/3 rounded-2xl p-6 w-full max-w-2xl">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                {selected.profile_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selected.profile_image} alt={selected.full_name || "profile"} className="w-14 h-14 rounded-full object-cover border border-white/10" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-slate-700/30 flex items-center justify-center text-white font-medium text-lg">{initials(selected.full_name)}</div>
                )}
                <div>
                  <h4 className="text-lg font-semibold">{selected.full_name}</h4>
                  <div className="text-xs text-slate-400">{selected.email}</div>
                </div>
              </div>

              <button onClick={() => setSelected(null)} className="text-slate-400">Close</button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-300">
              <div><strong>Phone:</strong> {selected.phone || "-"}</div>
              <div><strong>Active:</strong> {selected.is_active ? "Yes" : "No"}</div>
              <div><strong>Firebase UID:</strong> {selected.firebase_uid || "-"}</div>
              <div><strong>Created:</strong> {formatDate(selected.created_at)}</div>
              <div className="col-span-2"><strong>Password hash:</strong> <div className="text-xs break-all mt-1">{selected.password_hash || "(hidden)"}</div></div>
            </div>

            <div className="mt-6 flex gap-2">
              <button className="px-4 py-2 rounded-xl bg-white/6">Suspend</button>
              <button className="px-4 py-2 rounded-xl bg-white/6" onClick={() => openChat(selected)}>
                Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat panel */}
      {chatOpen && chatUser && (
        <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
  className="w-full max-w-4xl bg-gradient-to-br from-[#071033] to-[#08162b] rounded-2xl border border-white/6 shadow-2xl text-white p-6 relative"
  initial={{ y: 20, opacity: 0, scale: 0.98 }}
  animate={{ y: 0, opacity: 1, scale: 1 }}
  exit={{ y: 10, opacity: 0, scale: 0.99 }}
>
  <button
    aria-label="Close"
    onClick={closeChat}
    className="absolute right-6 top-6 w-9 h-9 rounded-full bg-amber-500 text-black flex items-center justify-center hover:bg-amber-400 transition"
  >
    <X size={20} />
  </button>
            <div className="flex items-center gap-3 p-4 border-b border-white/6">
              {chatUser.profile_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={chatUser.profile_image} className="w-10 h-10 rounded-full object-cover" alt={chatUser.full_name || "avatar"} />
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-700/30 flex items-center justify-center text-white font-medium">{initials(chatUser.full_name)}</div>
              )}
              <div className="flex-1">
                <div className="font-semibold">{chatUser.full_name}</div>
                <div className="text-xs text-slate-400">{chatUser.email}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => {/* open user profile perhaps */}} className="px-3 py-1 rounded-lg bg-white/6 text-sm">Profile</button>
              </div>
            </div>

            <div ref={msgRef} className="flex-1 p-4 overflow-y-auto space-y-3" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.02), transparent)" }}>
              {(chatMessages[chatUser.user_id] ?? []).map((m) => {
                const mine = m.from_user_id === 0; // replace 0 with real current user id
                return (
                  <div key={String(m.id)} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${mine ? "bg-white/6" : "bg-white/5"}`}>
                      <div className="whitespace-pre-wrap">{m.body}</div>
                      <div className="text-xs text-slate-400 mt-2">{m.created_at ? new Date(m.created_at).toLocaleString() : ""}</div>
                    </div>
                  </div>
                );
              })}

              {(chatMessages[chatUser.user_id] ?? []).length === 0 && (
                <div className="text-center text-slate-400">No messages yet — say hello 👋</div>
              )}
            </div>

            <div className="p-3 border-t border-white/6">
              <div className="flex items-end gap-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Message ${chatUser.full_name}... (Enter to send)`}
                  className="flex-1 min-h-[44px] max-h-36 resize-none rounded-2xl p-3 bg-white/5 text-sm"
                />
                <div className="flex flex-col gap-2">
                  <button
                    onClick={sendMessage}
                    disabled={sending || !newMessage.trim()}
                    className="px-4 py-2 rounded-xl bg-white/6 disabled:opacity-50"
                  >
                    {sending ? "Sending…" : "Send"}
                  </button>
                </div>
              </div>
            </div>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
      )}
    </section>
  );
}
