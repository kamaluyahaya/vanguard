"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Menu, X } from "lucide-react";
import UserSidebar from "@/app/components/user/sidebar";
import { useRouter } from "next/navigation";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export default function WithdrawRequestPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [active, setActive] = useState("wallet");

  const [userName, setUserName] = useState("Investor");
  const [userEmail, setUserEmail] = useState("");

  const [amount, setAmount] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  const [requests, setRequests] = useState<any[]>([]);
  const [listLoading, setListLoading] = useState(false);

  const router = useRouter();

  const getStoredAuth = () => {
    try {
      const rawAuth = localStorage.getItem("user_auth");
      if (rawAuth) {
        try {
          const parsed = JSON.parse(rawAuth);
          if (parsed?.token || parsed?.user) return parsed;
        } catch {}
      }
      const token = localStorage.getItem("token");
      const userRaw = localStorage.getItem("user");
      const user = userRaw ? JSON.parse(userRaw) : null;
      if (token || user) return { token, user };
      return null;
    } catch (e) {
      return null;
    }
  };

  // Load user from localStorage once
 useEffect(() => {
    // load user from localStorage
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("user") || localStorage.getItem("user_auth");
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          const u = parsed.user ?? parsed;
          setUserName(u?.name ?? "Investor");
          setUserEmail(u?.email ?? "");
        } catch (e) {
          // ignore
        }
      }
    }
  }, []);

  const fetchRequests = async () => {
    const auth = getStoredAuth();
    const user_id = auth?.user?.id || null;
    if (!user_id) return;
    setListLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/fund/withdraw/${user_id}`);
      if (!res.ok) throw new Error("Failed to fetch withdraw requests");
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setFeedback("❌ Failed to load withdraw requests.");
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    // fetch list on mount
    fetchRequests();
  }, []);

  const handleNavChange = (id: string) => {
    if (id === "logout") {
      localStorage.removeItem("user_token");
      localStorage.removeItem("user_token");
      localStorage.removeItem("user_auth");
      router.push("/");
    } else {
      setActive(id);
    }
    setSidebarOpen(false);
  };

  const resetForm = () => setAmount("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback("");
    const auth = getStoredAuth();
    const user_id = auth?.user?.id || null;
    const token = auth?.token || null;

    if (!user_id) {
      setFeedback("❌ User not found. Please login again.");
      return;
    }

    const parsedAmount = parseFloat(String(amount));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFeedback("❌ Enter a valid amount greater than zero.");
      return;
    }

    setSubmitLoading(true);

    try {
      const res = await fetch(`${BACKEND}/api/fund/withdraw/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ user_id, amount: parsedAmount }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Failed to submit withdraw request");
      }

      const json = await res.json();
      setFeedback("✅ Withdraw request submitted.");
      resetForm();
      // re-fetch list to show new request
      fetchRequests();
    } catch (err) {
      console.error(err);
      setFeedback("❌ Failed to submit withdraw request. Try again.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "-";
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return iso;
    }
  };

  const statusBadge = (s: string) => {
    const st = (s || "").toLowerCase();
    const base = "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium";
    if (st === "pending") return <span className={`${base} bg-yellow-600/20 text-amber-300 border border-amber-400/20`}>Pending</span>;
    if (st === "approved" || st === "success") return <span className={`${base} bg-green-600/10 text-emerald-300 border border-emerald-400/20`}>Approved</span>;
    if (st === "rejected" || st === "declined") return <span className={`${base} bg-red-600/10 text-rose-300 border border-rose-400/10`}>Rejected</span>;
    return <span className={`${base} bg-slate-700 text-slate-200`}>{s || "unknown"}</span>;
  };

  return (
    <div className="flex min-h-screen text-slate-100 antialiased">
      {/* Mobile sidebar toggle */}
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
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0`}
      >
        <UserSidebar
          active={active}
          onChange={handleNavChange}
          userName={userName}
          userEmail={userEmail}
          onLogout={() => {
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            localStorage.removeItem("auth");
            router.push("/");
          }}
        />
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
        />
      )}

      {/* Main content */}
      <main className="flex-1 p-6 md:ml-72">
        <h1 className="text-4xl py-5 text-center md:text-5xl lg:text-6xl font-bold mb-6">[withdraw funds]</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleSubmit} className="lg:col-span-1 space-y-4 bg-white/5 p-6 rounded-xl border border-white/10">
            <div>
              <label className="block text-sm font-medium mb-1">Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white focus:ring-2 focus:ring-amber-400 outline-none"
                placeholder="Enter amount to withdraw"
              />
            </div>

            <button
              type="submit"
              disabled={submitLoading}
              className="w-full px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center gap-2"
            >
              {submitLoading && <Loader2 className="animate-spin w-4 h-4" />}
              {submitLoading ? "Submitting..." : "Request Withdraw"}
            </button>

            {feedback && <p className="text-sm mt-2">{feedback}</p>}

            <p className="text-xs text-slate-400">Requests are reviewed by admins. Check status below.</p>
          </form>

          <section className="lg:col-span-2 bg-white/5 p-6 rounded-xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Your withdraw requests</h2>
              <div className="flex items-center gap-2">
                <button onClick={fetchRequests} className="px-3 py-1 rounded-lg bg-white/6">Refresh</button>
              </div>
            </div>

            {listLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="animate-spin w-6 h-6" />
              </div>
            ) : requests.length === 0 ? (
              <p className="text-sm text-slate-400">No withdraw requests yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="text-slate-300 border-b border-white/6">
                      <th className="px-3 py-2">ID</th>
                      <th className="px-3 py-2">Amount</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Admin note</th>
                      <th className="px-3 py-2">Requested</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((r) => (
                      <tr key={r.request_id} className="border-b border-white/4 hover:bg-white/2">
                        <td className="px-3 py-3">{r.request_id}</td>
                        <td className="px-3 py-3">{Number(r.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="px-3 py-3">{statusBadge(r.status)}</td>
                        <td className="px-3 py-3">{r.admin_note || "-"}</td>
                        <td className="px-3 py-3">{formatDate(r.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
