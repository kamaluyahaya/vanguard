"use client";

import { useEffect, useMemo, useState } from "react";
import { Menu, Search, X } from "lucide-react";
import TeslaInvestmentModal from "./../../components/modal/tesla-investment-modal";
import SignupModal from "./../../components/modal/signup";
import UserSidebar from "./../../components/user/sidebar";
import { useRouter } from "next/navigation";
import InvestmentDetailModal from "@/app/components/modal/investmentDetails";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

type Investment = {
  id: string; // "tesla:1"
  source: "tesla";
  name: string;
  slug?: string;
  category?: string;
  min_investment?: string | number | null;
  expected_return?: string | number | null;
  duration?: string | null;
  overview?: string | null;
  risk?: string | null;
  is_featured?: number | boolean;
  created_at?: string | null;
  raw: any;
};

function useDebounce<T>(value: T, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function Home() {
  const [open, setOpen] = useState(false); // Tesla modal
  const [signupOpen, setSignupOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile toggle
  const [active, setActive] = useState<string>("invest-tesla");
  const [userName, setUserName] = useState<string>("Investor");
  const [userEmail, setUserEmail] = useState<string>("");

  const router = useRouter();

  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 300);
  const [category, setCategory] = useState<string>("All");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tesla, setTesla] = useState<any[]>([]);
  const [selectedInv, setSelectedInv] = useState<Investment | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 12;

  // Fetch Tesla investments only
  useEffect(() => {
    const ac = new AbortController();
    const fetchTesla = async () => {
      try {
        setLoading(true);
        setError(null);
        const url = new URL(`${BACKEND}/api/tesla`);
        url.searchParams.set("limit", "200");
        url.searchParams.set("offset", "0");

        const res = await fetch(url.toString(), { signal: ac.signal });
        if (!res.ok) {
          const body = await res.text().catch(() => null);
          throw new Error(`Failed to load: ${res.status} ${body || res.statusText}`);
        }

        const json = await res.json();
        // support both shapes: { data: { investments: [...] } } or { investments: [...] }
        const investments =
          json?.data?.investments ?? json?.investments ?? json?.data ?? [];

        // normalize: expect an array
        const arr = Array.isArray(investments) ? investments : [];
        setTesla(arr);
      } catch (err: any) {
        if (err.name === "AbortError") return;
        console.error(err);
        setError(err.message || "Failed to fetch Tesla investments");
      } finally {
        setLoading(false);
      }
    };

    fetchTesla();
    return () => ac.abort();
  }, []);

  // unified list (tesla only)
  const unified = useMemo<Investment[]>(
    () =>
      tesla
        .map((r: any) => ({
          id: `tesla:${r.tesla_id}`,
          source: "tesla" as const,
          name: r.investment_name,
          slug: r.slug,
          category: r.category,
          min_investment: r.min_investment,
          expected_return: r.expected_return,
          duration: r.duration,
          overview: r.overview,
          risk: r.risk,
          is_featured: r.is_featured,
          created_at: r.created_at,
          raw: r,
        }))
        .sort((a, b) => {
          const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
          const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
          return tb - ta;
        }),
    [tesla]
  );

  // categories derived from the full set
  const categories = useMemo(() => {
    const set = new Set<string>(["All"]);
    unified.forEach((i) => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set);
  }, [unified]);

  // filtered list (client-side search + category) — debounced search
  const filtered = useMemo(() => {
    const term = String(debounced || "").trim().toLowerCase();
    let data = unified;

    if (category && category !== "All") {
      data = data.filter((i) => String(i.category || "").toLowerCase() === String(category || "").toLowerCase());
    }

    if (term.length > 0) {
      data = data.filter((i) => {
        const overview = (i.raw?.overview || i.overview || "").toString().toLowerCase();
        const name = (i.name || "").toString().toLowerCase();
        const slug = (i.slug || "").toString().toLowerCase();
        const cat = (i.category || "").toString().toLowerCase();
        return name.includes(term) || overview.includes(term) || slug.includes(term) || cat.includes(term);
      });
    }

    return data;
  }, [unified, debounced, category]);

  // pagination based on filtered
  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const pageData = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page]);

  // reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debounced, category]);

  // user load from local storage (unchanged)
  const [user, setUser] = useState<any | null>(null);
  useEffect(() => {
    try {
      const rawAuth = localStorage.getItem("auth");
      if (rawAuth) {
        const parsed = JSON.parse(rawAuth);
        if (parsed?.user) return setUser(parsed.user);
        if (parsed?.token && parsed?.user) return setUser(parsed.user);
      }
      const rawUser = localStorage.getItem("user");
      if (rawUser) return setUser(JSON.parse(rawUser));
      const alt = localStorage.getItem("auth");
      if (alt) {
        try {
          const p = JSON.parse(alt);
          if (p?.email) setUser(p);
        } catch {}
      }
    } catch (e) {
      console.warn("failed reading user from storage", e);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        const { name, email } = JSON.parse(savedUser);
        setUserName(name || "Investor");
        setUserEmail(email || "");
      }
    }
  }, []);

  const handleNavChange = (id: string) => {
    if (id === "invest-tesla" || id === "post-tesla") {
      setOpen(true);
    } else if (id === "logout") {
      localStorage.removeItem("user");
      router.push("/login");
    } else {
      setActive(id);
    }
    setSidebarOpen(false);
  };

  const displayName = user?.full_name || user?.name || "Investor";
  const displayEmail = user?.email || "";
  const avatar = user?.profile_image || user?.photo || null;
  const initial = String(displayName || "I").slice(0, 1).toUpperCase();

  const formatCurrency = (v?: string | number) => {
    if (v == null || v === "") return "-";
    try {
      const num = Number(v);
      return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } catch {
      return String(v);
    }
  };

  const truncate = (s?: string, n = 120) => (s && s.length > n ? s.slice(0, n).trim() + "…" : s || "");

  return (
    <>
      <div className="text-slate-100 antialiased">
        {/* Mobile toggle button */}
        <div className="md:hidden fixed top-4 left-4 z-50">
          <button onClick={() => setSidebarOpen((s) => !s)} className="p-2 rounded-lg bg-white/6 backdrop-blur text-slate-100">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Sidebar */}
        <aside
          className={`fixed top-0 left-0 h-screen w-72 z-40 transform transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 `}
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
        {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-30 bg-black/40 md:hidden" />}

        {/* Main content */}
        <main className="ml-0 md:ml-72 min-h-screen p-6">
          {/* Center cluster: search icon + input + avatar + name */}
          <header className="mb-6">
            <div className="flex justify-center">
              <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/6 border border-white/10 max-w-6xl w-full mx-4" style={{ alignItems: "center" }}>
                <button aria-label="Search" className="p-2 rounded-full hover:bg-white/8 flex items-center justify-center" onClick={() => {}}>
                  <Search size={16} />
                </button>

                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search investments, transactions, people..." className="w-full bg-transparent outline-none placeholder:text-slate-400 text-slate-100 text-sm" aria-label="Search" />
                </div>

                <div className="hidden sm:block w-px h-6 bg-white/10 mx-2" />

                <div className="flex items-center gap-2 ml-1">
                  {avatar ? (
                    <img src={avatar} alt={displayName} className="w-9 h-9 rounded-full object-cover border border-white/10" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-slate-700/30 flex items-center justify-center text-white font-medium">{initial}</div>
                  )}
                  <div className="hidden sm:flex flex-col leading-tight">
                    <span className="text-sm font-medium text-white">{displayName}</span>
                    {displayEmail && <span className="text-xs text-slate-400">{displayEmail}</span>}
                  </div>
                </div>
              </div>
            </div>
          </header>

          <h1 className="text-4xl py-5 text-center md:text-5xl lg:text-6xl font-bold mb-6">[tesla investment]</h1>

          {/* category buttons + search summary */}
          <div className="max-w-6xl mx-auto mb-4 px-4">
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((cat) => (
                <button key={cat} onClick={() => { setCategory(cat); setPage(1); }} className={`px-3 py-2 rounded-full text-sm font-medium transition ${ category === cat ? "bg-amber-500 text-black" : "bg-white/6 text-slate-100 hover:bg-white/8" }`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* table card */}
          <div className="container mx-auto bg-white/5 rounded-2xl border border-white/8 overflow-hidden">
            <div className="p-4 border-b border-white/6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Investments</h3>
                <div className="text-xs text-slate-400">Showing {pageData.length} of {total}</div>
              </div>
              <div className="text-xs text-slate-400">Sort: <strong className="text-white">Recent</strong></div>
            </div>

            {/* table header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 text-slate-300 text-xs uppercase tracking-wide">
              <div className="col-span-4">Name</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-2 text-right">Min</div>
              <div className="col-span-2 text-right">Return</div>
              <div className="col-span-1 text-right">Risk</div>
              <div className="col-span-1 text-right">Created</div>
            </div>

            {/* rows */}
            <div>
              {loading && <div className="p-6 text-center text-slate-400">Loading…</div>}
              {error && <div className="p-4 text-center text-red-400">{error}</div>}
              {!loading && pageData.length === 0 && <div className="p-6 text-center text-slate-400">No investments found.</div>}

              {pageData.map((row) => (
                <div key={row.id} role="button" onClick={() => { setSelectedInv(row); setDetailOpen(true); }} className="grid grid-cols-1 md:grid-cols-12 gap-4 px-4 py-4 items-center hover:bg-white/4 transition cursor-pointer">
                  <div className="col-span-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-700/30 flex items-center justify-center text-sm font-semibold text-white">F</div>
                      <div>
                        <div className="text-sm font-medium text-white">{row.name}</div>
                        <div className="text-xs text-slate-400">{row.slug || "—"} • TESLA</div>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2 text-sm text-slate-300">{row.category || "—"}</div>

                  <div className="col-span-2 text-right text-sm">
                    <div>{row.min_investment ? Number(row.min_investment).toLocaleString() : "-"}</div>
                  </div>

                  <div className="col-span-2 text-right text-sm">
                    <div>{row.expected_return ? `${row.expected_return}%` : "-"}</div>
                  </div>

                  <div className="col-span-1 text-right text-sm">{row.risk || "—"}</div>

                  <div className="col-span-1 text-right text-xs text-slate-400">{row.created_at ? new Date(row.created_at).toLocaleDateString() : "-"}</div>
                </div>
              ))}
            </div>

            {/* pagination */}
            <div className="flex items-center justify-between p-4 border-t border-white/6">
              <div className="text-sm text-slate-400">Page {page} of {pages}</div>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded bg-white/6 text-sm">Prev</button>
                <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className="px-3 py-1 rounded bg-white/6 text-sm">Next</button>
              </div>
            </div>
          </div>
        </main>

        {/* Modals */}
        <TeslaInvestmentModal isOpen={open} onClose={() => setOpen(false)} />
        <SignupModal isOpen={signupOpen} onClose={() => setSignupOpen(false)} onSuccess={() => router.push("/invest-tesla")} />
      </div>

      <InvestmentDetailModal isOpen={detailOpen} onClose={() => { setDetailOpen(false); setSelectedInv(null); }} inv={selectedInv} />
    </>
  );
}
