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
  balance?: number | string | null;
  wallet_balance?: number | string | null;
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

  const [userBalances, setUserBalances] = useState<Record<number, number>>({});
  const [balanceLoading, setBalanceLoading] = useState<Record<number, boolean>>({});

  const [actionOpen, setActionOpen] = useState<"none" | "fund" | "withdraw">("none");
  const [txnAmount, setTxnAmount] = useState<string>("");
  const [txnLoading, setTxnLoading] = useState(false);
  const [txnError, setTxnError] = useState<string | null>(null);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatUser, setChatUser] = useState<Customer | null>(null);
  const [chatMessages, setChatMessages] = useState<Record<number, Message[]>>({});
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const msgRef = useRef<HTMLDivElement | null>(null);

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

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / limit));
  const pageData = useMemo(() => {
    const start = (page - 1) * limit;
    return filtered.slice(start, start + limit);
  }, [filtered, page, limit]);

  const formatDate = (d?: string | null) => (d ? new Date(d).toLocaleString() : "-");
  const initials = (name?: string) =>
    (name ? name.split(" ").map((s) => s[0]).join("").slice(0, 2) : "U").toUpperCase();

  useEffect(() => setPage(1), [query, limit]);

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
    if (chatUser) {
      loadMessages(chatUser.user_id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatUser]);

  useEffect(() => scrollToBottom(), [chatMessages, chatOpen]);

  const loadMessages = async (userId: number) => {
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
    const meId = 0;
    const msg: Message = {
      id: fakeId,
      from_user_id: meId,
      to_user_id: toId,
      body: newMessage.trim(),
      created_at: new Date().toISOString(),
    };

    setChatMessages((prev) => {
      const prevList = prev[toId] ?? [];
      return { ...prev, [toId]: [...prevList, msg] };
    });
    setNewMessage("");
    setSending(true);
    scrollToBottom();

    try {
      const res = await fetch(`${BACKEND}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to_user_id: toId, body: msg.body }),
      });
      if (!res.ok) throw new Error("send failed");
      const saved = await res.json();
      setChatMessages((prev) => {
        const list = prev[toId] ?? [];
        return {
          ...prev,
          [toId]: list.map((m) => (m.id === fakeId && saved?.id ? { ...m, id: saved.id } : m)),
        };
      });
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setSending(false);
      scrollToBottom();
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const loadBalance = async (userId: number) => {
    setBalanceLoading((s) => ({ ...s, [userId]: true }));
    const existing = customers.find((c) => c.user_id === userId);
    const maybe = existing?.balance ?? existing?.wallet_balance;
    if (maybe != null) {
      const num = Number(maybe);
      if (!Number.isNaN(num)) {
        setUserBalances((b) => ({ ...b, [userId]: num }));
        setBalanceLoading((s) => ({ ...s, [userId]: false }));
        return;
      }
    }

    const endpoints = [
      `${BACKEND}/api/customers/${userId}`,
      `${BACKEND}/api/customers?user_id=${userId}`,
      `${BACKEND}/api/fund/user/${userId}`,
      `${BACKEND}/api/wallets/${userId}`,
      `${BACKEND}/api/fund/admin/user/${userId}`,
    ];

    try {
      for (const ep of endpoints) {
        try {
          const res = await fetch(ep, { method: "GET" });
          if (!res.ok) continue;
          const json = await res.json();
          const candidates = [
            json?.balance,
            json?.wallet?.balance,
            json?.data?.balance,
            json?.data?.wallet?.balance,
            json?.wallet_balance,
            json?.amount,
          ];
          const found = candidates.find((c) => c !== undefined && c !== null);
          if (found !== undefined && found !== null) {
            const n = Number(found);
            if (!Number.isNaN(n)) {
              setUserBalances((b) => ({ ...b, [userId]: n }));
              return;
            }
          }
        } catch (e) {
          continue;
        }
      }
      setUserBalances((b) => ({ ...b, [userId]: 0 }));
    } finally {
      setBalanceLoading((s) => ({ ...s, [userId]: false }));
    }
  };

  useEffect(() => {
    if (selected) {
      loadBalance(selected.user_id);
      setActionOpen("none");
      setTxnAmount("");
      setTxnError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const performTxn = async (type: "fund" | "withdraw") => {
    if (!selected) return;
    setTxnError(null);
    const amt = parseFloat(txnAmount);
    if (Number.isNaN(amt) || amt <= 0) {
      setTxnError("Enter a valid amount greater than 0");
      return;
    }

    setTxnLoading(true);
    try {
      const url = `${BACKEND}/api/fund/admin/${type}`;
      const body = { user_id: selected.user_id, amount: amt };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => null);
        throw new Error(text || `Failed to ${type} wallet`);
      }
      await res.json().catch(() => ({}));

      setUserBalances((prev) => {
        const prevVal = prev[selected.user_id];
        if (typeof prevVal === "number") {
          const newVal = type === "fund" ? prevVal + amt : prevVal - amt;
          return { ...prev, [selected.user_id]: newVal };
        }
        return prev;
      });

      setTxnAmount("");
      setActionOpen("none");
      setTxnError(null);

      try {
        const cRes = await fetch(`${BACKEND}/api/customers/${selected.user_id}`);
        if (cRes.ok) {
          const cJson = await cRes.json();
          const updated = Array.isArray(cJson) ? cJson[0] : cJson?.data ?? cJson;
          if (updated) {
            setCustomers((prev) => prev.map((p) => (p.user_id === selected.user_id ? { ...p, ...updated } : p)));
          }
        }
      } catch (e) {
        // ignore
      }
    } catch (err: unknown) {
      setTxnError(err instanceof Error ? err.message : String(err));
    } finally {
      setTxnLoading(false);
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
              if (rows.length === 0) return;
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
              <thead className="text-slate-500 text-left">
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
                    <td className="py-3 text-slate-400">{c.email || "—"}</td>
                    <td className="py-3 text-slate-400">{c.phone || "—"}</td>
                    <td className="py-3 text-slate-400">{formatDate(c.created_at)}</td>
                    <td className="py-3 text-slate-400">{c.is_active ? "Yes" : "No"}</td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setSelected(c)} className="px-3 py-1 rounded-lg bg-white/6 text-sm">
                          View
                        </button>
                       

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

      {/* Detail modal (white background) */}
      {selected && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-lg">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                {selected.profile_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selected.profile_image} alt={selected.full_name || "profile"} className="w-14 h-14 rounded-full object-cover border border-slate-200" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-medium text-lg">{initials(selected.full_name)}</div>
                )}
                <div>
                  <h4 className="text-lg font-semibold text-slate-900">{selected.full_name}</h4>
                  <div className="text-xs text-slate-500">{selected.email}</div>
                </div>
              </div>

              <button onClick={() => setSelected(null)} className="text-slate-600">Close</button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-700">
              <div><strong>Phone:</strong> <span className="text-slate-600">{selected.phone || "-"}</span></div>
              <div><strong>Active:</strong> <span className="text-slate-600">{selected.is_active ? "Yes" : "No"}</span></div>
              <div><strong>Firebase UID:</strong> <span className="text-slate-600">{selected.firebase_uid || "-"}</span></div>
              <div><strong>Created:</strong> <span className="text-slate-600">{formatDate(selected.created_at)}</span></div>
              <div className="col-span-2"><strong>Password hash:</strong> <div className="text-xs break-all mt-1 text-slate-500">{selected.password_hash || "(hidden)"}</div></div>

              {/* Balance row */}
              <div className="col-span-2 mt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-500">Wallet balance</div>
                    <div className="text-lg font-medium text-slate-900">
                      {balanceLoading[selected.user_id] ? (
                        <span className="text-slate-500">Loading…</span>
                      ) : (
                        <span>₦{(userBalances[selected.user_id] ?? (selected.balance ?? selected.wallet_balance ?? 0)).toLocaleString()}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setActionOpen((a) => (a === "fund" ? "none" : "fund"));
                        setTxnError(null);
                      }}
                      className="px-3 py-2 rounded-xl bg-emerald-500 text-black font-medium"
                    >
                      Fund
                    </button>
                    <button
                      onClick={() => {
                        setActionOpen((a) => (a === "withdraw" ? "none" : "withdraw"));
                        setTxnError(null);
                      }}
                      className="px-3 py-2 rounded-xl bg-rose-500 text-black font-medium"
                    >
                      Withdraw
                    </button>
                  </div>
                </div>

                {actionOpen !== "none" && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex flex-col md:flex-row md:items-center gap-2">
                      <input
                        inputMode="decimal"
                        value={txnAmount}
                        onChange={(e) => setTxnAmount(e.target.value)}
                        placeholder="Amount (e.g. 1500.00)"
                        className="flex-1 rounded-lg p-2 border border-slate-200 bg-white text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => performTxn(actionOpen === "fund" ? "fund" : "withdraw")}
                          disabled={txnLoading}
                          className="px-3 py-2 rounded-lg bg-slate-100 text-slate-900"
                        >
                          {txnLoading ? "Processing…" : actionOpen === "fund" ? "Confirm fund" : "Confirm withdraw"}
                        </button>
                        <button
                          onClick={() => {
                            setActionOpen("none");
                            setTxnAmount("");
                            setTxnError(null);
                          }}
                          className="px-3 py-2 rounded-lg bg-slate-100 text-slate-900"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                    {txnError && <div className="mt-2 text-xs text-rose-500">{txnError}</div>}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button className="px-4 py-2 rounded-xl bg-slate-100 text-slate-900">Suspend</button>
              <button className="px-4 py-2 rounded-xl bg-slate-100 text-slate-900" onClick={() => openChat(selected)}>
                Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat panel (white background) */}
      {chatOpen && chatUser && (
        <AnimatePresence>
          <motion.div
            className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-4xl bg-white rounded-2xl border border-slate-200 shadow-2xl text-slate-900 p-6 relative"
              initial={{ y: 20, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 10, opacity: 0, scale: 0.99 }}
            >
              <button
                aria-label="Close"
                onClick={closeChat}
                className="absolute right-6 top-6 w-9 h-9 rounded-full bg-slate-100 text-slate-900 flex items-center justify-center hover:bg-slate-200 transition"
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-3 p-4 border-b border-slate-100">
                {chatUser.profile_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={chatUser.profile_image} className="w-10 h-10 rounded-full object-cover" alt={chatUser.full_name || "avatar"} />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-medium">{initials(chatUser.full_name)}</div>
                )}
                <div className="flex-1">
                  <div className="font-semibold text-slate-900">{chatUser.full_name}</div>
                  <div className="text-xs text-slate-500">{chatUser.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => {/* open user profile perhaps */}} className="px-3 py-1 rounded-lg bg-slate-100 text-slate-900 text-sm">Profile</button>
                </div>
              </div>

              <div ref={msgRef} className="flex-1 p-4 overflow-y-auto space-y-3" style={{ background: "transparent" }}>
                {(chatMessages[chatUser.user_id] ?? []).map((m) => {
                  const mine = m.from_user_id === 0;
                  return (
                    <div key={String(m.id)} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${mine ? "bg-slate-100" : "bg-slate-50"}`}>
                        <div className="whitespace-pre-wrap text-slate-800">{m.body}</div>
                        <div className="text-xs text-slate-500 mt-2">{m.created_at ? new Date(m.created_at).toLocaleString() : ""}</div>
                      </div>
                    </div>
                  );
                })}

                {(chatMessages[chatUser.user_id] ?? []).length === 0 && (
                  <div className="text-center text-slate-500">No messages yet — say hello 👋</div>
                )}
              </div>

              <div className="p-3 border-t border-slate-100">
                <div className="flex items-end gap-2">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Message ${chatUser.full_name}... (Enter to send)`}
                    className="flex-1 min-h-[44px] max-h-36 resize-none rounded-2xl p-3 border border-slate-100 bg-white text-sm"
                  />
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={sendMessage}
                      disabled={sending || !newMessage.trim()}
                      className="px-4 py-2 rounded-xl bg-slate-100 disabled:opacity-50 text-slate-900"
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
