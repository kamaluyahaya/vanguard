"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Menu, X, Share2, ExternalLink, Info, RefreshCw } from "lucide-react";
import UserSidebar from "@/app/components/user/sidebar";
import { useRouter } from "next/navigation";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

type ApiInvestment = {
  investment_id: number;
  user_id: number;
  amount: string; // "900.00000000"
  coin_id?: string | null;
  coin_symbol?: string | null;
  coin_name?: string | null;
  coin_data?: string | null; // JSON string
  price_usd?: string | null;
  status?: string | null;
  expected_return?: string | null;
  actual_return?: string | null;
  roi_percent?: string | null;
  duration_days?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type Investment = Omit<ApiInvestment, "amount" | "coin_data" | "price_usd" | "expected_return" | "actual_return" | "roi_percent"> & {
  amount: number;
  price_usd?: number | null;
  expected_return?: number | null;
  actual_return?: number | null;
  roi_percent?: number | null;
  coin_data_parsed?: any;
};

  interface LocalUser {
  full_name?: string
  name?: string
  email?: string
  profile_image?: string
  photo?: string
  [key: string]: any // fallback for extra properties
}

export default function InvestmentsPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [active, setActive] = useState("investments");
  const [userName, setUserName] = useState("Investor");
  const [userEmail, setUserEmail] = useState("");
  const [selected, setSelected] = useState<Investment | null>(null);
  const [localUser, setLocalUser] = useState<LocalUser | null>(null)

  const router = useRouter();


  // helper: parse JWT payload (base64url safe)
const parseJwt = (token: string | null) => {
  if (!token) return null
  try {
    const base64Url = token.split(".")[1]
    if (!base64Url) return null
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

const getStoredAuth = () => {
  try {
    const rawAuth = localStorage.getItem("user_auth")
    if (rawAuth) {
      const parsed = JSON.parse(rawAuth)
      if (parsed?.token || parsed?.user) return parsed
    }

    const token = localStorage.getItem("user_token")
    const userRaw = localStorage.getItem("user")
    const user = userRaw ? JSON.parse(userRaw) : null

    if (token || user) return { token, user }
    return null
  } catch {
    return null
  }
}


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


    const auth = getStoredAuth();
  const token = auth?.token || null;
          const userFromStorage = auth?.user || null;

  useEffect(() => {
    const fetchInvestments = async () => {
      setLoading(true);
      setError(null);


          if (userFromStorage) {
    setLocalUser(userFromStorage);
  } else {
    setLocalUser(null);
  }

      // resolve user id (fallback to 1)
      const auth = getStoredAuth()
const token = auth?.token || null

let userId = 0

// 1️⃣ Prefer user object (same as sidebar)
if (auth?.user) {
  userId = Number(
    auth.user.user_id ??
    auth.user.id ??
    auth.user.uid ??
    0
  )
}

// 2️⃣ Fallback to JWT payload
if (!userId && token) {
  const payload = parseJwt(token)
  userId = Number(
    payload?.user_id ??
    payload?.id ??
    payload?.sub ??
    0
  )
}

// 3️⃣ Hard stop if still invalid
if (!userId) {
  console.warn("No valid userId found, redirecting to login")
  router.push("/login")
  return
}

     
      try {
        const res = await fetch(`${BACKEND}/api/fund/invest/user/${userId}`);
        if (!res.ok) throw new Error(`Failed to fetch investments (${res.status})`);
        const data: ApiInvestment[] = await res.json();

        const mapped: Investment[] = (Array.isArray(data) ? data : []).map((d) => {
          let coin_parsed = null;
          if (d.coin_data) {
            try {
              coin_parsed = JSON.parse(d.coin_data);
            } catch (e) {
              coin_parsed = null;
            }
          }
          return {
            ...d,
            amount: Number(Number(d.amount ?? 0)),
            price_usd: d.price_usd ? Number(d.price_usd) : null,
            expected_return: d.expected_return ? Number(d.expected_return) : null,
            actual_return: d.actual_return ? Number(d.actual_return) : null,
            roi_percent: d.roi_percent ? Number(d.roi_percent) : null,
            coin_data_parsed: coin_parsed,
          } as Investment;
        });

        setInvestments(mapped);
      } catch (err: any) {
        console.error("Failed to fetch investments:", err);
        setError(String(err?.message ?? err));
        setInvestments([]); // empty on error
      } finally {
        setLoading(false);
      }
    };

    fetchInvestments();
  }, []);

  const totalInvested = useMemo(() => investments.reduce((s, i) => s + (i.amount || 0), 0), [investments]);

  function fmt(n?: number | null) {
    if (n == null) return "-";
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function statusBadge(status?: string) {
    const base = "inline-flex items-center px-2 py-1 text-xs rounded-full font-medium";
    switch (status) {
      case "active":
        return <span className={`${base} bg-emerald-800 text-emerald-300`}>Active</span>;
      case "completed":
        return <span className={`${base} bg-slate-800 text-slate-200`}>Completed</span>;
      case "cancelled":
        return <span className={`${base} bg-rose-800 text-rose-300`}>Cancelled</span>;
      case "failed":
        return <span className={`${base} bg-rose-900 text-rose-200`}>Failed</span>;
      default:
        return <span className={`${base} bg-white/6 text-slate-200`}>{status ?? "initialized"}</span>;
    }
  }

  return (
    <div className="flex min-h-screen text-slate-100 antialiased ">
      {/* Mobile toggle */}
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
          onChange={(id: string) => {
            if (id === "logout") {
              localStorage.removeItem("user_token");
              router.push("/login");
            } else {
              setActive(id);
            }
            setSidebarOpen(false);
          }}
          userName={userName}
          userEmail={userEmail}
          onLogout={() => {
            localStorage.removeItem("user_token");
            localStorage.removeItem("user_token");
            localStorage.removeItem("user_auth");
            router.push("/");
          }}
        />
      </aside>

      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-30 bg-black/40 md:hidden" />}

      <main className="flex-1 p-6 md:ml-72">
        <header className="mb-6 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">My Investments</h1>
          <div className="mt-2 text-sm text-slate-400">Initialized & active investments (from /api/fund/invest/user/:id)</div>
        </header>

        <section className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="rounded-2xl bg-white/5 p-4 border border-white/8 flex items-center gap-4">
              <div className="text-sm text-slate-400">Total invested</div>
              <div className="text-2xl font-semibold">${fmt(totalInvested)}</div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  // simple page-level refresh to re-fetch
                  setLoading(true);
                  setError(null);
                  window.location.reload();
                }}
                className="px-3 py-2 rounded-xl bg-white/6 flex items-center gap-2"
              >
                <RefreshCw size={16} /> Refresh
              </button>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  const rows = [
                    ["investment_id", "coin", "amount", "status", "expected_return", "roi_percent", "created_at"],
                    ...investments.map((i) => [
                      String(i.investment_id ?? ""),
                      `${i.coin_symbol ?? i.coin_name ?? "-"}`,
                      String(i.amount ?? ""),
                      String(i.status ?? ""),
                      String(i.expected_return ?? ""),
                      String(i.roi_percent ?? ""),
                      String(i.created_at ?? ""),
                    ]),
                  ];
                  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
                  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `investments_${new Date().toISOString().slice(0,10)}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-3 py-2 rounded-xl bg-white/6"
              >
                Export CSV
              </a>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-slate-400">
              <Loader2 className="animate-spin" /> Loading investments...
            </div>
          ) : error ? (
            <div className="text-rose-300">Failed to load investments: {error}</div>
          ) : investments.length === 0 ? (
            <div className="text-slate-400">No investments found.</div>
          ) : (
            <div className="grid gap-4">
              {investments.map((inv) => (
                <div key={inv.investment_id} className="p-4 rounded-2xl border border-white/8 bg-white/5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-slate-700/30 flex items-center justify-center text-sm font-semibold text-white shrink-0">
                      {(inv.coin_symbol ?? inv.coin_name ?? "C").slice(0,3)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-lg font-semibold text-white truncate">{inv.coin_name ?? inv.coin_symbol ?? "Unknown"}</div>
                        <div className="text-xs text-slate-400">{inv.coin_symbol}</div>
                        <div className="ml-2">{statusBadge(inv.status!)}</div>
                      </div>
                      <div className="text-sm text-slate-400 truncate mt-1">
                        Invested ${fmt(inv.amount)} • Price ${fmt(inv.price_usd ?? inv.coin_data_parsed?.price_usd ?? null)} • ROI {inv.roi_percent != null ? `${fmt(inv.roi_percent)}%` : "-"}
                      </div>
                      <div className="text-xs text-slate-500 mt-2">{new Date(inv.created_at ?? "").toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm text-slate-400">Expected</div>
                      <div className="text-lg font-semibold">${fmt(inv.expected_return ?? null)}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelected(inv)}
                        className="px-3 py-2 rounded-lg bg-white/6 text-sm"
                        title="Details"
                      >
                        <Info size={16} />
                      </button>

                      <a
                        href={`https://t.me/share/url?url=&text=${encodeURIComponent(
                          `I invested $${fmt(inv.amount)} in ${inv.coin_symbol || inv.coin_name}. Status: ${inv.status}.`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 rounded-lg bg-amber-500 text-black text-sm flex items-center gap-2"
                        title="Share to Telegram"
                      >
                        <Share2 size={14} /> Share
                      </a>

                      <a
                        href={inv.coin_name ? `https://coinlore.com/coins/${String(inv.coin_name).toLowerCase()}` : "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 rounded-lg bg-white/6 text-sm"
                        title="Open coin page"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Details modal/drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-3xl bg-slate-900 rounded-2xl border border-white/8 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-slate-700/30 flex items-center justify-center text-sm font-semibold text-white">
                  {(selected.coin_symbol ?? selected.coin_name ?? "C").slice(0,3)}
                </div>
                <div>
                  <div className="text-lg font-bold">{selected.coin_name} <span className="text-sm text-slate-400">({selected.coin_symbol})</span></div>
                  <div className="text-xs text-slate-400">Invested ${fmt(selected.amount)} • Status: {selected.status}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setSelected(null)} className="px-3 py-1 rounded bg-white/6">Close</button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white/4 p-3 rounded">
                  <div className="text-xs text-slate-400">Amount</div>
                  <div className="text-lg font-medium">${fmt(selected.amount)}</div>
                </div>
                <div className="bg-white/4 p-3 rounded">
                  <div className="text-xs text-slate-400">Expected return</div>
                  <div className="text-lg font-medium">${fmt(selected.expected_return ?? null)}</div>
                </div>
                <div className="bg-white/4 p-3 rounded">
                  <div className="text-xs text-slate-400">ROI %</div>
                  <div className="text-lg font-medium">{selected.roi_percent != null ? `${fmt(selected.roi_percent)}%` : "-"}</div>
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-400 mb-2">Coin payload</div>
                <div className="bg-white/5 p-3 rounded max-h-56 overflow-auto text-xs text-slate-300">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(selected.coin_data_parsed ?? {}, null, 2)}</pre>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <a
                  href={`https://t.me/share/url?url=&text=${encodeURIComponent(
                    `I invested $${fmt(selected.amount)} in ${selected.coin_symbol || selected.coin_name}.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded bg-amber-500 text-black font-medium"
                >
                  Share to Telegram
                </a>

                <a
                  href={selected.coin_name ? `https://coinlore.com/coins/${String(selected.coin_name).toLowerCase()}` : "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded bg-white/6"
                >
                  Open coin page
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
